4️⃣ AI-FIRST RULES (VERY IMPORTANT)
🔒 Rule 1: No Cross-App Imports (Except packages)

Frontends never import backend code.

Shared logic lives in:

packages/contracts

🔁 Rule 2: API Is the Contract

Backend defines routes

Frontends consume typed clients

No hidden coupling