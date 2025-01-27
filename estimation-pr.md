# Context Length Estimation

## Problem
System encounters 400 errors when context exceeds 65536 tokens. Current estimates are 9.7% too high (71889 vs 65536).

## Solution
1. Error Handling:
   - Catch 400 errors
   - Parse error to get token counts
   - Update runtime estimates

2. Retry Mechanism:
   - Apply refined estimates
   - Trigger cleaning and retries
   - Adjust temperature if looping
