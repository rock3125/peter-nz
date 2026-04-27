# Cognitive Debt

Confession.  I'm a 10x coder.  I'm not sure how, but there is something about my person that makes me incredibly fast at coding.  I've been a professional coder for just over 30 years now.  AI coding is faster than myself, and is getting really good.

## Technical debt
Technical debt occurs when you take a shortcut.  You make a tradeoff.  You save yourself some time, you avoid a particular issue, you kick the can down the road.  This concept is well known to all of us developers.

## Comprehension Debt
When you have the AI generate code there are a few things that happen.  There is the lack of a mental picture for that code.  AI is so fast at generating that even if you were to read it line by line, most people don't get the full picture, because they didn't write it themselves.  The deep thinking around that code never happened and isn't easily replicated.

After an AI generates code, and it is checked it, that code becomes legacy code (i.e. it is no longer maintained).

## The Doom Loop
How do you change code you haven't written?  How do you maintain it?  How do you fix bugs/issues in that code?  You use the AI to fix it.  This is when things usually go really wrong.  Any further patch by the AI tends to complicate the code even more.  The AI has to re-process the existing code and change it.

Even Anthropic admits that developers using AI score score lower on comprehension tasks (around 17% lower).

All of us professional developers grew up with debugging code.  It further grows the developer, and enhances, fine-tunes our skills.

## Some Solutions
We must adopt new strategies to overcome this comprehension debt.

- Document what is to be done, keep the original prompts around.  Capture architectural decisions and rationalles.
- Use the AI to explain what it has done.  Any trade-offs it made, and edge cases that might exist.
- Periodically, try and rewrite parts of the code base by hand.  Build your own model of what is going on.
- Score your own understanding of the code.  Grade it.  Do you fully understand it?  Or are you blissfully ignorant of what is going on?
- Treat the AI as a thinking partner, rather than a tool for passive code generation.

