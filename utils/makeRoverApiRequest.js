module.exports = async (requestFn, maxRetries = 3) => {
    // Track rate limits per bucket
    if (!global.roverRateLimits) {
        global.roverRateLimits = new Map();
    }
    
    let retries = 0;
    
    while (retries <= maxRetries) {
        try {
            const response = await requestFn();
            
             // Check if response is a proper Response object
             if (!response || typeof response !== 'object') {
                console.warn('Response is not a proper object:', response);
                return response; // Return whatever we got
            }
            
            return response;
        } catch (error) {
            // Handle rate limit errors (429)
            if ((error.response && error.response.status === 429) || (error.status === 429)) {
                const response = error.response || error;
                const retryAfter = parseFloat(response.headers?.get('retry-after')) || 5;
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
