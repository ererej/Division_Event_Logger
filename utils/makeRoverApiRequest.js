module.exports = async (requestFn, maxRetries = 3) => {
    // Track rate limits per bucket
    if (!global.roverRateLimits) {
        global.roverRateLimits = new Map();
    }
    
    let retries = 0;
    
    while (retries <= maxRetries) {
        try {
            const response = await requestFn();
            
            // Get rate limit info from headers
            if(!response.headers) {
                throw new Error('SEND HELP No headers found in response');
            }
            const bucket = response.headers.get('x-ratelimit-bucket');
            const remaining = parseInt(response.headers.get('x-ratelimit-remaining'), 10);
            const resetAfter = parseFloat(response.headers.get('x-ratelimit-reset-after'));
            
            // Store rate limit info
            if (bucket) {
                global.roverRateLimits.set(bucket, {
                    remaining,
                    resetAfter,
                    resetTime: Date.now() + resetAfter * 1000
                });
                
                console.log(`Bucket: ${bucket}, Remaining: ${remaining}, Reset After: ${resetAfter}s`);
            }
            
            return response;
        } catch (error) {
            // Handle rate limit errors (429)
            if (error.response && error.response.status === 429) {
                const retryAfter = parseInt(error.response.headers.get('retry-after'), 10) || 5;
                console.log(`Rate limited! Retrying after ${retryAfter} seconds...`);
                
                // Wait for the retry-after time before trying again
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                retries++;
            } else {
                // For non-rate-limit errors, just throw
                throw error;
            }
        }
    }
    
    throw new Error('Max retries exceeded for Rover API request');
}
