export type QuizCatalogQuestion = {
  topicKey: string;
  topicTitle: string;
  prompt: string;
  options: string[];
  correctOption: number;
  explanation: string;
};

const q = (
  topicKey: string,
  topicTitle: string,
  prompt: string,
  options: string[],
  correctOption: number,
  explanation: string
): QuizCatalogQuestion => ({
  topicKey,
  topicTitle,
  prompt,
  options,
  correctOption,
  explanation,
});

export const quizCatalog: QuizCatalogQuestion[] = [
  q(
    "safe-choices",
    "Manual Handling",
    "Before lifting a heavy box, what should you do first?",
    [
      "Test the weight and plan the lift",
      "Lift quickly before it becomes awkward",
      "Twist while lifting to gain momentum",
      "Ask someone to watch but not help",
    ],
    0,
    "Testing the load and planning the route helps you choose the safest method and assistance."
  ),
  q(
    "safe-choices",
    "Manual Handling",
    "Which posture best protects your back during a lift?",
    [
      "Rounded back and straight legs",
      "Neutral spine with the load close",
      "Load held at arm's length",
      "Twisted torso and bent neck",
    ],
    1,
    "Keeping the load close and maintaining a neutral spine reduces strain."
  ),
  q(
    "safe-choices",
    "Manual Handling",
    "A load blocks your view while carrying it. What is the safest choice?",
    [
      "Walk faster",
      "Carry it above your head",
      "Use a trolley or get assistance",
      "Turn sideways and continue",
    ],
    2,
    "A clear line of sight is essential; use mechanical help or another person."
  ),
  q(
    "safe-choices",
    "Manual Handling",
    "When should a team lift be used?",
    [
      "Whenever the item is brightly coloured",
      "When one person cannot safely control the load",
      "Only after a task is delayed",
      "Only for small packages",
    ],
    1,
    "A team lift is appropriate when the load exceeds one person's safe handling capability."
  ),
  q(
    "safe-choices",
    "Manual Handling",
    "What should you do if a handling task changes unexpectedly?",
    [
      "Continue to avoid stopping work",
      "Pause, reassess, and follow the safe process",
      "Ignore the change if the load is familiar",
      "Ask a colleague to accept the risk",
    ],
    1,
    "Pausing and reassessing prevents a changed condition from becoming an injury."
  ),

  q(
    "working-at-height",
    "Working at Height",
    "What is the first control to consider for work at height?",
    [
      "Avoid working at height where possible",
      "Work faster",
      "Remove the guardrail",
      "Use any available chair",
    ],
    0,
    "Eliminating the height task is safer than controlling a risk that remains."
  ),
  q(
    "working-at-height",
    "Working at Height",
    "Which item is never an appropriate access platform?",
    [
      "Inspected scaffold",
      "Approved mobile elevating work platform",
      "A makeshift stack of boxes",
      "A certified podium step",
    ],
    2,
    "Boxes and improvised platforms are unstable and are not designed for access work."
  ),
  q(
    "working-at-height",
    "Working at Height",
    "You notice a damaged ladder before use. What should you do?",
    [
      "Use it only for a short task",
      "Tag it out and report it",
      "Hide the damage with tape",
      "Ask someone to hold it",
    ],
    1,
    "Damaged equipment must be removed from service and reported for inspection."
  ),
  q(
    "working-at-height",
    "Working at Height",
    "Why should tools be secured when working above others?",
    [
      "To make them easier to lose",
      "To prevent dropped-object injuries",
      "To increase noise",
      "To avoid cleaning them",
    ],
    1,
    "Securing tools reduces the chance of objects falling onto people below."
  ),
  q(
    "working-at-height",
    "Working at Height",
    "Strong wind begins during roof work. What is the safest response?",
    [
      "Continue until the scheduled break",
      "Pause and follow the weather stop-work procedure",
      "Move closer to the edge",
      "Remove personal protective equipment",
    ],
    1,
    "Weather can change fall risk; stop and follow the agreed control procedure."
  ),

  q(
    "hazard-perception",
    "Hazard Perception",
    "What is a hazard?",
    [
      "A source with the potential to cause harm",
      "A completed safety inspection",
      "A training certificate",
      "A safe work method",
    ],
    0,
    "A hazard is something that can cause injury, illness, damage, or loss."
  ),
  q(
    "hazard-perception",
    "Hazard Perception",
    "You see a wet floor in a busy walkway. What should happen first?",
    [
      "Walk around it silently",
      "Warn others and arrange isolation or cleanup",
      "Take a photograph only",
      "Wait for someone to fall",
    ],
    1,
    "Immediate warning and control reduce exposure while the spill is dealt with."
  ),
  q(
    "hazard-perception",
    "Hazard Perception",
    "Which combination best describes risk?",
    [
      "Likelihood and consequence",
      "Colour and temperature",
      "Speed and distance only",
      "Noise and paperwork",
    ],
    0,
    "Risk considers how likely harm is and how severe the consequence could be."
  ),
  q(
    "hazard-perception",
    "Hazard Perception",
    "A new obstruction appears in an emergency route. What should you do?",
    [
      "Leave it until the next inspection",
      "Report it and restore the route immediately if safe",
      "Add another obstruction as a marker",
      "Use the route anyway",
    ],
    1,
    "Emergency routes must remain clear and issues should be corrected or escalated promptly."
  ),
  q(
    "hazard-perception",
    "Hazard Perception",
    "What is the best way to improve hazard perception?",
    [
      "Rely on memory alone",
      "Pause, scan the work area, and consider changing conditions",
      "Look only at the floor",
      "Assume familiar tasks are risk-free",
    ],
    1,
    "A deliberate scan helps identify hazards that change with people, equipment, and conditions."
  ),

  q(
    "unsafe-acts",
    "Unsafe Acts",
    "Which is an unsafe act?",
    [
      "Following the approved method",
      "Bypassing a machine guard to save time",
      "Reporting a near miss",
      "Using inspected equipment",
    ],
    1,
    "Bypassing a guard removes a safety control and exposes people to danger."
  ),
  q(
    "unsafe-acts",
    "Unsafe Acts",
    "A coworker asks you to ignore a permit requirement. What should you do?",
    [
      "Agree to keep the job moving",
      "Stop and follow the permit process",
      "Sign it later from memory",
      "Ask an untrained person to decide",
    ],
    1,
    "Permit controls exist to confirm hazards and precautions before work begins."
  ),
  q(
    "unsafe-acts",
    "Unsafe Acts",
    "Why should near misses be reported?",
    [
      "To assign blame automatically",
      "To learn and prevent a future incident",
      "To delay all work permanently",
      "Because they are already injuries",
    ],
    1,
    "Near misses reveal weaknesses before someone is harmed."
  ),
  q(
    "unsafe-acts",
    "Unsafe Acts",
    "What is the safest response when you see an unsafe shortcut?",
    [
      "Copy it if it looks efficient",
      "Intervene respectfully and report or correct it",
      "Record it but allow it to continue",
      "Wait until the end of the year",
    ],
    1,
    "Early, respectful intervention helps restore safe behaviour before harm occurs."
  ),
  q(
    "unsafe-acts",
    "Unsafe Acts",
    "If production pressure conflicts with a critical safety control, which takes priority?",
    [
      "The safety control",
      "The fastest option",
      "The least visible option",
      "No decision is needed",
    ],
    0,
    "Critical safety controls must not be removed to meet production pressure."
  ),

  q(
    "five-whys",
    "Five Whys / Root-Cause Analysis",
    "What is the purpose of the Five Whys method?",
    [
      "To find a person to blame",
      "To explore underlying causes of a problem",
      "To shorten an inspection",
      "To replace all evidence",
    ],
    1,
    "The method asks successive why questions to move from symptoms toward underlying causes."
  ),
  q(
    "five-whys",
    "Five Whys / Root-Cause Analysis",
    "What makes a strong root-cause question?",
    [
      "It is based on evidence and the actual event",
      "It assumes the answer",
      "It focuses only on personality",
      "It avoids the work process",
    ],
    0,
    "Evidence-based questions keep the analysis connected to what actually happened."
  ),
  q(
    "five-whys",
    "Five Whys / Root-Cause Analysis",
    "A repeated equipment failure occurs. Which action is most useful?",
    [
      "Replace the operator without analysis",
      "Review maintenance, process, and environmental factors",
      "Delete previous reports",
      "Ignore failures that are small",
    ],
    1,
    "Multiple contributing factors often explain repeated failures; review the whole system."
  ),
  q(
    "five-whys",
    "Five Whys / Root-Cause Analysis",
    "What should a corrective action do?",
    [
      "Only remind people to be careful",
      "Address a verified cause and be measurable",
      "Hide the incident",
      "Create more paperwork without an owner",
    ],
    1,
    "Effective actions target causes, have ownership, and can be checked for effectiveness."
  ),
  q(
    "five-whys",
    "Five Whys / Root-Cause Analysis",
    "When should a root-cause analysis stop?",
    [
      "After the first why",
      "When the cause is sufficiently supported and an effective action is identified",
      "When someone is blamed",
      "Before collecting evidence",
    ],
    1,
    "Stop when the analysis has a supported cause and a practical, verifiable improvement."
  ),

  q(
    "cyber-awareness",
    "Cyber Awareness",
    "What should you do with an unexpected link in an email?",
    [
      "Open it quickly",
      "Verify the sender and report or delete it if suspicious",
      "Forward it to everyone",
      "Enter your password to test it",
    ],
    1,
    "Unexpected links may be phishing; verify through a trusted channel and report concerns."
  ),
  q(
    "cyber-awareness",
    "Cyber Awareness",
    "Which password practice is safest?",
    [
      "Reuse one short password",
      "Use a unique strong password and approved manager",
      "Share passwords with teammates",
      "Write it on a public noticeboard",
    ],
    1,
    "Unique strong credentials reduce the impact of a compromised account."
  ),
  q(
    "cyber-awareness",
    "Cyber Awareness",
    "You find an unknown USB drive at work. What should you do?",
    [
      "Plug it in to identify the owner",
      "Give it to the approved IT or security contact",
      "Take it home",
      "Copy its files to a shared computer",
    ],
    1,
    "Unknown removable media can contain malware and should be handled by the approved team."
  ),
  q(
    "cyber-awareness",
    "Cyber Awareness",
    "Why are software updates important?",
    [
      "They only change colours",
      "They can fix security weaknesses",
      "They remove all backups",
      "They make passwords public",
    ],
    1,
    "Updates commonly include fixes for vulnerabilities that attackers could exploit."
  ),
  q(
    "cyber-awareness",
    "Cyber Awareness",
    "What is the safest response to a request for sensitive information?",
    [
      "Send it immediately",
      "Confirm the request through a trusted channel",
      "Post it in a public chat",
      "Use a personal email account",
    ],
    1,
    "Independent verification helps prevent social-engineering and impersonation attacks."
  ),
];

export const QUIZ_QUESTION_COUNT = 5;
export const QUIZ_PASS_PERCENT = 80;
