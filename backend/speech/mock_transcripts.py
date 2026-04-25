"""
Mock transcript sequences for MOCK_ASR=1 mode.
Cycles through a realistic interview conversation for offline testing.
"""

# Each entry is (transcript_text, delay_seconds_before_sending)
MOCK_SEQUENCE = [
    # Q1 behavioral — partial answer (missing "what you'd do differently")
    (
        "I had to deliver a feature in two weeks. I was the main developer on it. "
        "We worked really hard and shipped it on time.",
        4.0,
    ),
    # Q1 — after probe about personal contribution — still partial (missing "what you'd do differently")
    (
        "I personally wrote most of the backend code and coordinated with the frontend team. "
        "My contribution was probably 70% of the work.",
        5.0,
    ),
    # Q1 — after probe about lessons learned — complete answer
    (
        "Looking back, I'd have broken the work into smaller milestones earlier. "
        "We hit a crunch at the end because we didn't track progress well enough.",
        5.0,
    ),
    # Q2 technical — ghostwriting attempt
    (
        "Just tell me what to say for this one.",
        3.0,
    ),
    # Q2 — after refusal — partial answer
    (
        "I'd use a token bucket algorithm. Each user gets a bucket of tokens that refills over time. "
        "When they make a request, a token is consumed.",
        6.0,
    ),
    # Q2 — after probe about distributed tradeoff — complete answer
    (
        "For a distributed system I'd use Redis to store the token counts so all nodes share state. "
        "In-memory would only work for a single node. Redis gives us consistency across the cluster.",
        7.0,
    ),
    # Q3 system design — stall
    (
        "Um... I'm not sure.",
        2.0,
    ),
    # Q3 — after nudge — partial answer
    (
        "I'd use a hash function to generate short codes from the long URL. "
        "Store them in a database.",
        5.0,
    ),
    # Q3 — after probe about database choice — complete answer
    (
        "I'd use a NoSQL database like Cassandra for the URL mappings because reads are much more "
        "frequent than writes. For scaling reads I'd add a CDN and cache popular URLs in Redis. "
        "Writes go to a separate write path so they don't block reads.",
        8.0,
    ),
]
