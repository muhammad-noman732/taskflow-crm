import { Response } from 'express';
export declare class ResponseHelper {
    static success<T>(res: Response, data: T, message?: string, statusCode?: number): Response<any, Record<string, any>>;
    static error(res: Response, message: string, statusCode?: number, error?: string): Response<any, Record<string, any>>;
    static paginated<T>(res: Response, data: T[], page: number, limit: number, total: number, message?: string): Response<any, Record<string, any>>;
    static validationError(res: Response, errors: string[]): Response<any, Record<string, any>>;
    static unauthorized(res: Response, message?: string): Response<any, Record<string, any>>;
    static forbidden(res: Response, message?: string): Response<any, Record<string, any>>;
    static notFound(res: Response, message?: string): Response<any, Record<string, any>>;
    static conflict(res: Response, message?: string): Response<any, Record<string, any>>;
}
//# sourceMappingURL=response.d.ts.map