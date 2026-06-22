// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DeliveryManagement
 * @notice Tamper-proof, role-gated ledger of package deliveries for the
 *         blockchain-based delivery management system.
 *
 * @dev The contract is the single source of truth for delivery state. Every
 *      lifecycle transition is enforced on-chain and may only be triggered by
 *      the correct role:
 *
 *        seller   -> createDelivery()    (CREATED)
 *        admin    -> assignAgent()       (ASSIGNED)
 *        agent    -> updateStatus()      (DISPATCHED -> IN_TRANSIT)
 *        customer -> confirmDelivery()   (DELIVERED)
 *
 *      The lifecycle is strictly forward-only (no skipping, no reversing) and a
 *      DELIVERED record is final. The contract follows the
 *      checks-effects-interactions pattern, reverts with descriptive messages,
 *      and emits an event for every state change.
 */
contract DeliveryManagement {
    /**
     * @notice The ordered lifecycle states of a delivery.
     * @dev Order is significant: numeric values encode lifecycle progression.
     */
    enum Status {
        CREATED, // 0 - order registered by the seller
        ASSIGNED, // 1 - delivery agent assigned by the admin
        DISPATCHED, // 2 - agent has dispatched the package
        IN_TRANSIT, // 3 - package is on its way to the customer
        DELIVERED // 4 - customer has confirmed receipt (final)
    }

    /**
     * @notice On-chain representation of a single delivery order.
     */
    struct Delivery {
        uint256 id; // unique, auto-incrementing identifier (starts at 1)
        address seller; // account that created the order
        address customer; // account that will confirm receipt
        address agent; // account responsible for delivery (set on assignment)
        string description; // human-readable description of the package
        Status status; // current lifecycle state
        uint256 createdAt; // block timestamp when the order was created
        uint256 updatedAt; // block timestamp of the most recent state change
    }

    /// @notice Administrator allowed to assign agents. Set once at deployment.
    address public immutable admin;

    /// @dev Number of deliveries created so far; also the last assigned id.
    uint256 private _deliveryCount;

    /// @dev Maps a delivery id to its stored record.
    mapping(uint256 => Delivery) private _deliveries;

    /// @notice Emitted when a seller creates a new delivery order.
    event DeliveryCreated(uint256 id, address seller, address customer);

    /// @notice Emitted when the admin assigns a delivery agent to an order.
    event AgentAssigned(uint256 id, address agent);

    /// @notice Emitted whenever the assigned agent advances the delivery status.
    event StatusUpdated(uint256 id, Status newStatus);

    /// @notice Emitted when the customer confirms receipt of the package.
    event DeliveryConfirmed(uint256 id);

    /**
     * @notice Records the deploying account as the contract administrator.
     * @dev The admin is immutable and is the only account permitted to assign
     *      agents to deliveries.
     */
    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Reverts if `id` does not correspond to an existing delivery. Valid
     *      ids range from 1 to the current delivery count.
     */
    modifier deliveryExists(uint256 id) {
        require(id > 0 && id <= _deliveryCount, "Delivery does not exist");
        _;
    }

    /**
     * @notice Create a new delivery order. The caller is recorded as the seller.
     * @dev Anyone may act as a seller for their own orders. The new delivery
     *      starts in the CREATED state with an auto-incremented id beginning
     *      at 1. Follows checks-effects-interactions: state is written before
     *      the event is emitted.
     * @param customer The account that will later confirm receipt.
     * @param description Human-readable description of the package.
     * @return id The id assigned to the newly created delivery.
     */
    function createDelivery(address customer, string calldata description)
        external
        returns (uint256)
    {
        // Checks
        require(customer != address(0), "Customer cannot be zero address");
        require(customer != msg.sender, "Seller and customer must differ");

        // Effects
        _deliveryCount += 1;
        uint256 id = _deliveryCount;

        _deliveries[id] = Delivery({
            id: id,
            seller: msg.sender,
            customer: customer,
            agent: address(0),
            description: description,
            status: Status.CREATED,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        // Interactions (event)
        emit DeliveryCreated(id, msg.sender, customer);
        return id;
    }

    /**
     * @notice Assign a delivery agent to a CREATED order. Admin only.
     * @dev Moves the delivery from CREATED to ASSIGNED. Only the admin set in
     *      the constructor may call this.
     * @param id The delivery to assign an agent to.
     * @param agent The account that will be responsible for the delivery.
     */
    function assignAgent(uint256 id, address agent)
        external
        deliveryExists(id)
    {
        // Checks
        require(msg.sender == admin, "Only admin can assign agent");
        require(agent != address(0), "Agent cannot be zero address");

        Delivery storage delivery = _deliveries[id];
        require(delivery.status == Status.CREATED, "Delivery not in CREATED state");

        // Effects
        delivery.agent = agent;
        delivery.status = Status.ASSIGNED;
        delivery.updatedAt = block.timestamp;

        // Interactions (event)
        emit AgentAssigned(id, agent);
    }

    /**
     * @notice Advance a delivery's status. Assigned agent only.
     * @dev Permits only the strict forward transitions
     *      ASSIGNED -> DISPATCHED and DISPATCHED -> IN_TRANSIT. Any skip,
     *      reversal, or attempt to set CREATED/ASSIGNED/DELIVERED here reverts.
     *      Reaching DELIVERED is handled exclusively by confirmDelivery().
     * @param id The delivery to update.
     * @param newStatus The next status; must be the immediate forward state.
     */
    function updateStatus(uint256 id, Status newStatus)
        external
        deliveryExists(id)
    {
        Delivery storage delivery = _deliveries[id];

        // Checks
        require(msg.sender == delivery.agent, "Only assigned agent can update status");
        require(
            (delivery.status == Status.ASSIGNED && newStatus == Status.DISPATCHED) ||
                (delivery.status == Status.DISPATCHED && newStatus == Status.IN_TRANSIT),
            "Invalid status transition"
        );

        // Effects
        delivery.status = newStatus;
        delivery.updatedAt = block.timestamp;

        // Interactions (event)
        emit StatusUpdated(id, newStatus);
    }

    /**
     * @notice Confirm receipt of a package. Assigned customer only.
     * @dev Moves the delivery from IN_TRANSIT to DELIVERED, which is the final
     *      state. Only the customer recorded on the order may call this.
     * @param id The delivery to confirm.
     */
    function confirmDelivery(uint256 id) external deliveryExists(id) {
        Delivery storage delivery = _deliveries[id];

        // Checks
        require(msg.sender == delivery.customer, "Only assigned customer can confirm delivery");
        require(delivery.status == Status.IN_TRANSIT, "Delivery not in transit");

        // Effects
        delivery.status = Status.DELIVERED;
        delivery.updatedAt = block.timestamp;

        // Interactions (event)
        emit DeliveryConfirmed(id);
    }

    /**
     * @notice Read the full record for a delivery. Callable by anyone.
     * @param id The delivery to read.
     * @return The stored Delivery struct.
     */
    function getDelivery(uint256 id)
        external
        view
        deliveryExists(id)
        returns (Delivery memory)
    {
        return _deliveries[id];
    }

    /**
     * @notice Total number of deliveries created so far.
     * @return The current delivery count (also the highest valid id).
     */
    function getDeliveryCount() external view returns (uint256) {
        return _deliveryCount;
    }
}
