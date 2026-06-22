import { Injectable } from '@nestjs/common';

/** Shape of the API home/health payload. */
export interface ApiInfo {
  name: string;
  status: string;
  docs: string;
}

/**
 * AppService holds the (small) logic behind the API home route. Keeping it in a
 * service — rather than inline in the controller — follows the project rule that
 * controllers only route and services own logic.
 */
@Injectable()
export class AppService {
  /** Return basic service info plus where to find the interactive docs. */
  getInfo(): ApiInfo {
    return {
      name: 'Blockchain Delivery API',
      status: 'ok',
      docs: '/docs',
    };
  }
}
