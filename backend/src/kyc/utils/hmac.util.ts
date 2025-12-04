import * as crypto from 'crypto';

export class HmacValidator {
    /**
     * Validate Sumsub webhook HMAC signature
     * @param payload - Raw request body as string
     * @param signature - x-payload-digest header value
     * @param secret - SUMSUB_WEBHOOK_SECRET from env
     * @returns true if signature is valid
     */
    static validateSumsubWebhook(
        payload: string,
        signature: string,
        secret: string,
    ): boolean {
        if (!signature || !secret) {
            return false;
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        // Use timing-safe comparison to prevent timing attacks
        try {
            return crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature),
            );
        } catch {
            // Lengths don't match
            return false;
        }
    }
}
