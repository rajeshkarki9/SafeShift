/* Style: SafeShift white-base login, employee readiness, and role portals with vivid animated pastel logo-color gradients. */
import {
  IconActivity,
  IconArrowLeft,
  IconArrowRight,
  IconCheckCircle,
  IconCircleDashed,
  IconClock,
  IconDashboard,
  IconEye,
  IconEyeOff,
  IconLogOut,
  IconTrendUp,
  IconUser,
  IconUsers,
} from "@/components/icons";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { PPECheckModule } from "@/components/PPECheckModule";
import { VRModule } from "@/components/VRModule";

type Role = "employee" | "manager";
type Session = {
  email: string;
  role: Role;
  name: string;
  mustChangePassword: boolean;
};
type LearningStage = "ready" | "training" | "quiz" | "results" | "progress";
type PortalRoute =
  | "training"
  | "quiz"
  | "results"
  | "progress"
  | "manager-dashboard"
  | "manager-progress"
  | "manager-results"
  | "manager-completion"
  | "manager-profile";
type PortalNavigate = (route: PortalRoute, topicKey?: string) => Promise<void>;
type TopicRecord = {
  id: number;
  employeeEmail: string;
  displayName?: string;
  topicKey: string;
  topicTitle: string;
  learningStage: LearningStage;
  progressPercent: number;
  latestScore: number | null;
  vrScore?: number | null;
  completedAt: Date | null;
  updatedAt: Date;
};
type ManagerEmployee = {
  email: string;
  name: string;
  records: TopicRecord[];
  completion: number;
  status: "Completed" | "In Progress" | "Not Started";
  latestScore: number | null;
  incomplete: string[];
};
type QuizQuestionView = {
  id: number;
  topicKey: string;
  topicTitle: string;
  prompt: string;
  optionsJson: string;
  correctOption: number;
  explanation: string;
  sortOrder: number;
  active: number;
};
type QuizResult = {
  topicKey: string;
  topicTitle: string;
  score: number;
  percentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  completionStatus: string;
  vrScore?: number;
  answers: Array<{
    questionId: number;
    selectedOption: number;
    isCorrect: boolean;
  }>;
};

const roleStart: Record<Role, PortalRoute> = {
  employee: "training",
  manager: "manager-dashboard",
};
const coreTopic = { key: "safe-choices", title: "Safe choices" };
const TOTAL_WORKFORCE = 50;
const managerTopics = [
  { key: "safe-choices", title: "Manual Handling" },
  { key: "working-at-height", title: "Working at Height" },
  { key: "hazard-perception", title: "Hazard Perception" },
  { key: "unsafe-acts", title: "Unsafe Acts" },
  { key: "five-whys", title: "Five Whys / Root-Cause Analysis" },
  { key: "cyber-awareness", title: "Cyber Awareness" },
];
const QUIZ_PASS_PERCENT = 80;
const employeeStageExperiences: Record<
  string,
  {
    content: string;
    scenario: string;
    scenarioOptions: string[];
    scenarioAnswer: number;
    miniGame: string;
    miniGameOptions: string[];
    miniGameAnswer: number;
    challenge: string;
    challengeOptions: string[];
    challengeAnswer: number;
    vrImage?: string;
    vrText?: string;
  }
> = {
  "safe-choices": {
    content:
      "Plan the lift, keep the load close, maintain a neutral spine, and stop when conditions change.",
    scenario:
      "A box blocks your view on the route. What is the safest next step?",
    scenarioOptions: [
      "Carry it faster",
      "Use a trolley or get assistance",
      "Turn sideways",
    ],
    scenarioAnswer: 1,
    miniGame: "Choose the control that removes the most strain.",
    miniGameOptions: [
      "Hold the load at arm's length",
      "Use mechanical assistance",
      "Twist while lifting",
    ],
    miniGameAnswer: 1,
    challenge: "The load is heavier than expected. What should you do?",
    challengeOptions: [
      "Pause and reassess",
      "Continue to save time",
      "Ask someone to watch only",
    ],
    challengeAnswer: 0,
  },
  "working-at-height": {
    content:
      "Avoid height work where possible, inspect access equipment, secure tools, and stop when weather changes.",
    scenario:
      "You find a damaged ladder before use. What is the safest action?",
    scenarioOptions: [
      "Tag it out and report it",
      "Use it briefly",
      "Cover the damage",
    ],
    scenarioAnswer: 0,
    miniGame: "Pick the control that prevents a dropped-object injury.",
    miniGameOptions: [
      "Secure tools",
      "Work closer to the edge",
      "Remove the guardrail",
    ],
    miniGameAnswer: 0,
    challenge: "Wind increases during roof work. What should you do?",
    challengeOptions: [
      "Continue to the break",
      "Pause and follow stop-work procedure",
      "Remove PPE",
    ],
    challengeAnswer: 1,
  },
  "hazard-perception": {
    content:
      "Scan deliberately, consider changing conditions, warn others, isolate hazards, and report what cannot be fixed safely.",
    scenario: "A wet floor appears in a busy walkway. What comes first?",
    scenarioOptions: [
      "Warn others and isolate or clean it",
      "Wait for inspection",
      "Photograph it only",
    ],
    scenarioAnswer: 0,
    miniGame: "Risk is best understood as which combination?",
    miniGameOptions: [
      "Likelihood and consequence",
      "Colour and temperature",
      "Noise and paperwork",
    ],
    miniGameAnswer: 0,
    challenge: "An obstruction appears in an emergency route. What should you do?",
    challengeOptions: [
      "Leave it",
      "Report it and restore the route if safe",
      "Add another marker",
    ],
    challengeAnswer: 1,
    vrImage: "https://upload.wikimedia.org/wikipedia/commons/3/33/Spherical_panoramic_of_a_park_in_autumn.jpg",
    vrText: "Find the red hazard orb!",
  },
  "unsafe-acts": {
    content:
      "Follow approved methods, protect critical controls, report near misses, and intervene respectfully when shortcuts create risk.",
    scenario:
      "A coworker asks you to bypass a permit. What is the safest response?",
    scenarioOptions: [
      "Stop and follow the permit process",
      "Agree to keep moving",
      "Sign it later",
    ],
    scenarioAnswer: 0,
    miniGame: "Why report a near miss?",
    miniGameOptions: [
      "To assign blame",
      "To learn and prevent an incident",
      "To delay work permanently",
    ],
    miniGameAnswer: 1,
    challenge:
      "Production pressure conflicts with a critical safety control. Which takes priority?",
    challengeOptions: [
      "The safety control",
      "The fastest option",
      "No decision",
    ],
    challengeAnswer: 0,
  },
  "five-whys": {
    content:
      "Use evidence and successive why questions to move from symptoms toward verified underlying causes and measurable corrective actions.",
    scenario: "A failure repeats. Which investigation is strongest?",
    scenarioOptions: [
      "Review maintenance, process, and environment",
      "Replace the operator",
      "Delete old reports",
    ],
    scenarioAnswer: 0,
    miniGame: "A strong root-cause question should be based on what?",
    miniGameOptions: [
      "Assumptions",
      "Evidence and the actual event",
      "Personality",
    ],
    miniGameAnswer: 1,
    challenge: "When should analysis stop?",
    challengeOptions: [
      "After the first why",
      "When a supported cause and effective action are identified",
      "When someone is blamed",
    ],
    challengeAnswer: 1,
  },
  "cyber-awareness": {
    content:
      "Verify unusual requests through trusted channels, use unique strong credentials, and report suspicious messages or media.",
    scenario: "An unexpected email link arrives. What should you do?",
    scenarioOptions: [
      "Verify the sender and report or delete it",
      "Open it quickly",
      "Forward it widely",
    ],
    scenarioAnswer: 0,
    miniGame: "Which password practice is safest?",
    miniGameOptions: [
      "Reuse one short password",
      "Use a unique strong password and approved manager",
      "Share it with teammates",
    ],
    miniGameAnswer: 1,
    challenge: "You find an unknown USB drive. What should you do?",
    challengeOptions: [
      "Plug it in",
      "Give it to approved IT or security",
      "Take it home",
    ],
    challengeAnswer: 1,
  },
};
const logo = "/safeshift-logo-alpha.png";
const localLogo = logo;
const LOCAL_TOPIC_RECORDS_KEY = "safeshift:employee-topic-records";
type LocalTopicRecord = Omit<TopicRecord, "completedAt" | "updatedAt"> & {
  completedAt: string | null;
  updatedAt: string;
};

function getLocalTopicRecords(): TopicRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(
      window.localStorage.getItem(LOCAL_TOPIC_RECORDS_KEY) || "[]"
    ) as LocalTopicRecord[];
    return raw.map((record, index) => ({
      ...record,
      id: record.id || -(index + 1),
      completedAt: record.completedAt ? new Date(record.completedAt) : null,
      updatedAt: new Date(record.updatedAt || Date.now()),
    }));
  } catch {
    return [];
  }
}
function topicRecordIdentity(
  record: Pick<TopicRecord, "employeeEmail" | "topicKey">
) {
  return `${record.employeeEmail.trim().toLowerCase()}::${record.topicKey}`;
}
function isSameEmployeeTopic(
  record: TopicRecord,
  input: Pick<TopicRecord, "employeeEmail" | "topicKey">
) {
  return topicRecordIdentity(record) === topicRecordIdentity(input);
}
function getLocalTopicRecord(employeeEmail: string, topicKey: string) {
  return getLocalTopicRecords().find(
    record =>
      record.employeeEmail === employeeEmail && record.topicKey === topicKey
  );
}
function dedupeTopicRecords(records: TopicRecord[]) {
  const seen = new Set<string>();
  return records.filter(record => {
    const identity = topicRecordIdentity(record);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}
function getLocalQuizAttempts(employeeEmail: string) {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      window.localStorage.getItem(`safeshift:quiz-attempts:${employeeEmail}`) ||
        "[]"
    ) as Array<{
      topicKey: string;
      topicTitle: string;
      score: number;
      percentage: number;
      correctAnswers: number;
      incorrectAnswers: number;
      completionStatus: string;
      createdAt?: string | Date;
    }>;
  } catch {
    return [];
  }
}
function saveLocalTopicRecord(
  input: Pick<
    TopicRecord,
    | "employeeEmail"
    | "displayName"
    | "topicKey"
    | "topicTitle"
    | "learningStage"
    | "progressPercent"
    | "latestScore"
  >
) {
  if (typeof window === "undefined") return;
  const records = getLocalTopicRecords();
  const existing = records.find(record => isSameEmployeeTopic(record, input));
  const next: TopicRecord = {
    ...input,
    displayName: input.displayName || existing?.displayName || "Employee",
    id: existing?.id || Date.now(),
    completedAt:
      input.progressPercent === 100
        ? new Date()
        : existing?.completedAt || null,
    updatedAt: new Date(),
  };
  window.localStorage.setItem(
    LOCAL_TOPIC_RECORDS_KEY,
    JSON.stringify([
      next,
      ...records.filter(record => !isSameEmployeeTopic(record, input)),
    ])
  );
  return next;
}
function extractErrorMessage(error: unknown, fallback: string) {
  return typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
    ? (error as { message: string }).message
    : fallback;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const utils = trpc.useUtils();
  const sessionQuery = trpc.auth.session.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const login = trpc.auth.login.useMutation();
  const logout = trpc.auth.logout.useMutation();

  // Restore the signed session on first load so a refresh keeps the user signed in.
  useEffect(() => {
    if (sessionQuery.data) setSession(sessionQuery.data);
  }, [sessionQuery.data]);

  const signOut = async () => {
    try {
      await logout.mutateAsync();
    } catch {
      /* Logging out locally is still correct. */
    }
    setSession(null);
    setEmail("");
    setPassword("");
    setError("");
    utils.auth.session.setData(undefined, null);
    void utils.learning.invalidate();
  };

  const authenticate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      const next = await login.mutateAsync({
        email: email.trim().toLowerCase(),
        password,
      });
      setSession(next);
      setPassword("");
    } catch (loginError) {
      setError(extractErrorMessage(loginError, "Check email and password."));
    }
  };

  const handleSetupComplete = (next: Session) => {
    setSession(next);
    void utils.learning.invalidate();
  };

  if (sessionQuery.isLoading)
    return (
      <div className="role-login-page">
        <div className="role-login-scene" aria-hidden="true" />
        <main className="role-login-main">
          <p className="session-loading">Checking your session…</p>
        </main>
      </div>
    );
  if (session?.role === "employee" && session.mustChangePassword)
    return (
      <FirstLoginSetup
        session={session}
        onComplete={handleSetupComplete}
        onSignOut={signOut}
      />
    );
  if (session) return <RolePortal session={session} onSignOut={signOut} />;
  return (
    <div className="role-login-page">
      <div className="role-login-scene" aria-hidden="true" />
      <main className="role-login-main">
        <form className="role-login-card" onSubmit={authenticate}>
          <img
            className="role-login-mark"
            src={logo}
            onError={event => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = localLogo;
            }}
            alt="SafeShift logo"
          />
          <div className="role-login-title">
            <strong>Welcome to SafeShift</strong>
            <span>Login</span>
          </div>
          <label>
            Email
            <input
              autoComplete="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@employee.com"
              type="email"
              required
            />
          </label>
          <label>
            Password
            <div className="role-login-password-wrap">
              <input
                autoComplete="current-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                required
              />
              <button
                className="role-login-password-toggle"
                type="button"
                onClick={() => setShowPassword(visible => !visible)}
                aria-label={showPassword ? "Hide password" : "View password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
                <span>{showPassword ? "Hide" : "View"}</span>
              </button>
            </div>
          </label>
          {error && (
            <p className="role-login-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="role-login-submit"
            type="submit"
            disabled={login.isPending}
          >
            {" "}
            {login.isPending ? "Signing in…" : "Authenticate"}{" "}
            <IconArrowRight />
          </button>
          <div className="role-login-actors">
            <span>
              Employee<small>Training & quiz</small>
            </span>
            <span>
              Manager<small>Progress & results</small>
            </span>
          </div>
        </form>
      </main>
    </div>
  );
}

function FirstLoginSetup({
  session,
  onComplete,
  onSignOut,
}: {
  session: Session;
  onComplete: (next: Session) => void;
  onSignOut: () => void;
}) {
  const [name, setName] = useState(
    session.name && session.name !== "Employee" ? session.name : ""
  );
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const completeFirstLogin = trpc.auth.completeFirstLogin.useMutation();
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (
      newPassword.length < 8 ||
      !/[a-zA-Z]/.test(newPassword) ||
      !/\d/.test(newPassword)
    ) {
      setError(
        "Choose a password with at least 8 characters, including a letter and a number."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    try {
      const next = await completeFirstLogin.mutateAsync({
        newPassword,
        displayName: name.trim(),
        department: department.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      onComplete(next);
    } catch (setupError) {
      setError(
        extractErrorMessage(
          setupError,
          "Could not save your details. Try again."
        )
      );
    }
  };
  return (
    <div className="role-login-page readiness-page">
      <div className="role-login-scene" aria-hidden="true" />
      <main className="role-login-main">
        <form className="readiness-card first-login-card" onSubmit={submit}>
          <img
            className="role-login-mark"
            src={logo}
            onError={event => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = localLogo;
            }}
            alt="SafeShift logo"
          />
          <span className="readiness-eyebrow">FIRST SIGN-IN</span>
          <h1>Set up your account</h1>
          <p>
            You are signed in as <strong>{session.email}</strong>. Before you
            begin, set your own password and tell us who you are. You only do
            this once.
          </p>
          <label>
            Your full name
            <input
              autoComplete="name"
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Your full name"
              required
              maxLength={120}
            />
          </label>
          <div className="first-login-row">
            <label>
              Department (optional)
              <input
                value={department}
                onChange={event => setDepartment(event.target.value)}
                placeholder="e.g. Warehouse"
                maxLength={120}
              />
            </label>
            <label>
              Phone (optional)
              <input
                value={phone}
                onChange={event => setPhone(event.target.value)}
                placeholder="e.g. 555-0142"
                maxLength={40}
              />
            </label>
          </div>
          <label>
            New password
            <div className="role-login-password-wrap">
              <input
                autoComplete="new-password"
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                type={showPassword ? "text" : "password"}
                required
              />
              <button
                className="role-login-password-toggle"
                type="button"
                onClick={() => setShowPassword(visible => !visible)}
                aria-label={showPassword ? "Hide password" : "View password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
                <span>{showPassword ? "Hide" : "View"}</span>
              </button>
            </div>
          </label>
          <label>
            Confirm new password
            <input
              autoComplete="new-password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              placeholder="Repeat your new password"
              type={showPassword ? "text" : "password"}
              required
            />
          </label>
          {error && (
            <p className="role-login-error" role="alert">
              {error}
            </p>
          )}
          <div className="readiness-actions">
            <button
              type="button"
              className="readiness-back"
              onClick={onSignOut}
            >
              <IconArrowLeft /> Sign out
            </button>
            <button
              className="role-login-submit"
              type="submit"
              disabled={completeFirstLogin.isPending}
            >
              {completeFirstLogin.isPending ? "Saving…" : "Save & begin"}
              <IconArrowRight />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function RolePortal({
  session,
  onSignOut,
}: {
  session: Session;
  onSignOut: () => void;
}) {
  const { role } = session;
  const employeeEmail = session.email;
  const employeeName = role === "employee" ? session.name : "";
  const [route, setRoute] = useState<PortalRoute>(roleStart[role]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedTopicKey, setSelectedTopicKey] = useState(coreTopic.key);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const utils = trpc.useUtils();
  const topicRecord = trpc.learning.myTopic.useQuery(
    { topicKey: selectedTopicKey },
    { enabled: role === "employee", retry: false }
  );
  const employeeTopicRecords = trpc.learning.myTopicRecords.useQuery(
    undefined,
    { enabled: role === "employee", retry: false }
  );
  const saveTopicOutcome = trpc.learning.saveTopicOutcome.useMutation();
  const saveQuizAttempt = trpc.learning.saveQuizAttempt.useMutation();
  const quizAttempts = trpc.learning.quizAttempts.useQuery(undefined, {
    enabled: role === "employee",
    retry: false,
  });
  const managerRecords = trpc.learning.managerTopicRecords.useQuery(undefined, {
    enabled: role === "manager",
    retry: false,
  });
  const currentTopicRecord =
    topicRecord.data || getLocalTopicRecord(employeeEmail, selectedTopicKey);
  const allEmployeeTopicRecords = dedupeTopicRecords([
    ...(employeeTopicRecords.data || []),
    ...getLocalTopicRecords().filter(
      record => record.employeeEmail === employeeEmail
    ),
  ]);
  const visibleManagerRecords = dedupeTopicRecords([
    ...(managerRecords.data || []),
    ...getLocalTopicRecords(),
  ]);
  const label = role === "employee" ? employeeName : "Manager";
  const nav =
    role === "employee"
      ? [
          ["training", "Training"],
          ["quiz", "Quiz"],
          ["progress", "My progress"],
        ]
      : [];
  const navigate = async (next: PortalRoute, topicKey = selectedTopicKey) => {
    setSelectedEmployee(null);
    if (topicKey !== selectedTopicKey) setSelectedTopicKey(topicKey);
    setRoute(next);
  };
  const submitQuiz = async (result: QuizResult) => {
    const topic =
      managerTopics.find(item => item.key === result.topicKey) || coreTopic;
    const payload = {
      topicKey: result.topicKey,
      topicTitle: topic.title,
      score: result.score,
      percentage: result.percentage,
      completionStatus: result.completionStatus,
      answers: result.answers,
    };
    setQuizResult(result);
    setSelectedTopicKey(result.topicKey);
    setRoute("results");
    try {
      await saveQuizAttempt.mutateAsync(payload);
    } catch {
      window.localStorage.setItem(
        `safeshift:quiz-attempts:${employeeEmail}`,
        JSON.stringify([
          { ...payload, createdAt: new Date().toISOString() },
          ...getLocalQuizAttempts(employeeEmail),
        ])
      );
    }
    const outcome = {
      topicKey: result.topicKey,
      topicTitle: topic.title,
      learningStage: "progress" as LearningStage,
      progressPercent: 100,
      latestScore: result.percentage,
      vrScore: result.vrScore,
    };
    try {
      await saveTopicOutcome.mutateAsync(outcome);
    } catch {
      saveLocalTopicRecord({
        employeeEmail,
        displayName: employeeName,
        ...outcome,
      });
    }
    await utils.learning.myTopic.invalidate({ topicKey: result.topicKey });
    await utils.learning.myTopicRecords.invalidate();
    await quizAttempts.refetch();
  };
  return (
    <div className="portal-page">
      <header className="portal-header">
        <button
          className="portal-brand"
          onClick={() => navigate(roleStart[role])}
        >
          <img
            src={logo}
            onError={event => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = localLogo;
            }}
            alt="SafeShift"
          />
          <span>
            SafeShift<small>{label}</small>
          </span>
        </button>
        {role !== "manager" && (
          <nav>
            {nav.map(([key, text]) => (
              <button
                key={key}
                className={route === key ? "active" : ""}
                onClick={() => navigate(key as PortalRoute)}
              >
                {text}
              </button>
            ))}
          </nav>
        )}
        <button className="portal-signout" onClick={onSignOut}>
          <IconLogOut /> Sign out
        </button>
      </header>
      <main
        className={
          role === "manager" ? "portal-main manager-main" : "portal-main"
        }
      >
        {role === "employee" ? (
          <EmployeeRoute
            route={route}
            go={navigate}
            onSubmitQuiz={submitQuiz}
            name={employeeName}
            record={currentTopicRecord}
            records={allEmployeeTopicRecords}
            saving={saveQuizAttempt.isPending}
            selectedTopicKey={selectedTopicKey}
            onSelectTopic={setSelectedTopicKey}
            quizResult={quizResult}
            previousAttempts={
              quizAttempts.data?.length
                ? quizAttempts.data
                : getLocalQuizAttempts(employeeEmail)
            }
          />
        ) : (
          <ManagerRoute
            route={route}
            go={navigate}
            session={session}
            records={visibleManagerRecords}
            loading={managerRecords.isLoading && !visibleManagerRecords.length}
            selectedEmployee={selectedEmployee}
            onSelectEmployee={setSelectedEmployee}
          />
        )}
      </main>
    </div>
  );
}

function EmployeeRoute({
  route,
  go,
  onSubmitQuiz,
  name,
  record: _record,
  records,
  saving,
  selectedTopicKey,
  onSelectTopic: _onSelectTopic,
  quizResult,
  previousAttempts,
}: {
  route: PortalRoute;
  go: PortalNavigate;
  onSubmitQuiz: (result: QuizResult) => Promise<void>;
  name: string;
  record?: TopicRecord;
  records: TopicRecord[];
  saving: boolean;
  selectedTopicKey: string;
  onSelectTopic: (topicKey: string) => void;
  quizResult: QuizResult | null;
  previousAttempts: Array<{
    topicKey: string;
    topicTitle: string;
    score: number;
    percentage: number;
    correctAnswers: number;
    incorrectAnswers: number;
    completionStatus: string;
    createdAt?: string | Date;
  }>;
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [journeyStep, setJourneyStep] = useState(0);
  const [stageAnswer, setStageAnswer] = useState<number | null>(null);
  const [vrScore, setVrScore] = useState<number | null>(null);
  useEffect(() => {
    setQuestionIndex(0);
    setAnswers({});
    setJourneyStep(0);
    setStageAnswer(null);
    setVrScore(null);
  }, [selectedTopicKey, route]);
  const questionsQuery = trpc.learning.quizQuestions.useQuery(
    { topicKey: selectedTopicKey },
    { enabled: route === "quiz" }
  );
  const questions = (questionsQuery.data || []) as QuizQuestionView[];
  const parsedQuestions = questions.map(question => ({
    ...question,
    options: JSON.parse(question.optionsJson) as string[],
  }));
  if (route === "quiz") {
    const question = parsedQuestions[questionIndex];
    if (questionsQuery.isLoading)
      return (
        <section className="employee-quiz">
          <PortalHeading
            eyebrow="EMPLOYEE / QUIZ"
            title="Loading quiz"
            text="Preparing your five-question knowledge check."
          />
        </section>
      );
    if (!question)
      return (
        <section className="employee-quiz">
          <PortalHeading
            eyebrow="EMPLOYEE / QUIZ"
            title="Quiz unavailable"
            text="This topic does not have a question set yet."
          />
          <button className="portal-primary" onClick={() => go("training")}>
            Back to training
            <IconArrowLeft />
          </button>
        </section>
      );
    const selected = answers[question.id];
    const complete =
      parsedQuestions.length === 5 &&
      parsedQuestions.every(item => answers[item.id] !== undefined);
    const submit = () => {
      if (!complete) return;
      const submittedAnswers = parsedQuestions.map(item => ({
        questionId: item.id,
        selectedOption: answers[item.id],
        isCorrect: answers[item.id] === item.correctOption,
      }));
      const score = submittedAnswers.filter(item => item.isCorrect).length;
      const percentage = score * 20;
      void onSubmitQuiz({
        topicKey: selectedTopicKey,
        topicTitle: question.topicTitle,
        score,
        percentage,
        correctAnswers: score,
        incorrectAnswers: 5 - score,
        completionStatus:
          percentage >= QUIZ_PASS_PERCENT ? "Completed" : "Needs Review",
        vrScore: vrScore || undefined,
        answers: submittedAnswers,
      });
    };
    return (
      <section className="employee-quiz">
        <PortalHeading
          eyebrow={`EMPLOYEE / ${question.topicTitle.toUpperCase()}`}
          title="Knowledge check"
          text="Answer all five questions to complete this topic."
        />
        <div className="quiz-progress-meta">
          <span>Question {questionIndex + 1} of 5</span>
        </div>
        <div className="quiz-progress-track">
          <span style={{ width: `${((questionIndex + 1) / 5) * 100}%` }} />
        </div>
        <article className="quiz-question-card">
          <span className="quiz-question-number">
            Question {questionIndex + 1}
          </span>
          <h2>{question.prompt}</h2>
          <div className="quiz-options">
            {question.options.map((option, index) => (
              <button
                key={option}
                className={selected === index ? "selected" : ""}
                onClick={() =>
                  setAnswers(current => ({ ...current, [question.id]: index }))
                }
              >
                <span className="quiz-option-index">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            ))}
          </div>
        </article>
        <div className="quiz-navigation">
          <button
            className="portal-secondary"
            disabled={questionIndex === 0}
            onClick={() =>
              setQuestionIndex(current => Math.max(0, current - 1))
            }
          >
            <IconArrowLeft /> Previous
          </button>
          {questionIndex < 4 ? (
            <button
              className="portal-primary"
              disabled={selected === undefined}
              onClick={() =>
                setQuestionIndex(current => Math.min(4, current + 1))
              }
            >
              Next
              <IconArrowRight />
            </button>
          ) : (
            <button
              className="portal-primary"
              disabled={!complete || saving}
              onClick={submit}
            >
              {saving ? "Saving result…" : "Submit Quiz"}
              <IconCheckCircle />
            </button>
          )}
        </div>
        <p className="quiz-answer-status">
          {complete
            ? "All five questions answered."
            : `${Object.keys(answers).length} of 5 answered.`}
        </p>
      </section>
    );
  }
  if (route === "training") {
    const journey = [
      "Training content",
      "Interactive scenario",
      "Mini-game",
      "Challenge activity",
      "360 VR Experience",
    ];
    const topic =
      managerTopics.find(item => item.key === selectedTopicKey) || coreTopic;
    const experience =
      employeeStageExperiences[selectedTopicKey] ||
      employeeStageExperiences[coreTopic.key];
    const stageCopy =
      journeyStep === 0
        ? experience.content
        : journeyStep === 1
          ? experience.scenario
          : journeyStep === 2
            ? experience.miniGame
            : journeyStep === 3
              ? experience.challenge
              : (experience as any).vrText || "Explore the virtual environment and identify the hazards around you.";
    const stageOptions =
      journeyStep === 1
        ? experience.scenarioOptions
        : journeyStep === 2
          ? experience.miniGameOptions
          : experience.challengeOptions;
    const stageAnswerKey =
      journeyStep === 1
        ? experience.scenarioAnswer
        : journeyStep === 2
          ? experience.miniGameAnswer
          : experience.challengeAnswer;
    const isPPEMinigame = selectedTopicKey === "safe-choices" && journeyStep === 2;
    const needsChoice = journeyStep > 0 && journeyStep < 4 && !isPPEMinigame;
    const advance = () => {
      if (journeyStep < 4) {
        setJourneyStep(current => current + 1);
        setStageAnswer(null);
      } else void go("quiz");
    };
    return (
      <section className="employee-training">
        <PortalHeading
          eyebrow="EMPLOYEE / TRAINING"
          title={`Welcome, ${name || "Employee"}`}
          text="Select a topic to open its five-question quiz."
        />
        <div className="employee-topic-grid">
          {managerTopics.map(item => (
            <button
              key={item.key}
              className={`employee-topic-card ${selectedTopicKey === item.key ? "selected" : ""}`}
              onClick={() => void go("quiz", item.key)}
            >
              <span>{item.title}</span>
              <small>Open quiz</small>
              <IconArrowRight />
            </button>
          ))}
        </div>
        <article className="employee-journey-card">
          <span>LEARNING JOURNEY / {journeyStep + 1} OF 5</span>
          <h2>{topic.title}</h2>
          <div className="employee-journey-steps">
            {journey.map((step, index) => (
              <div
                className={index <= journeyStep ? "complete" : ""}
                key={step}
              >
                <b>{index + 1}</b>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <div className="employee-stage-content">
            <strong>{journey[journeyStep]}</strong>
            <p>{stageCopy}</p>
            {journeyStep === 4 && (
              <VRModule
                imageUrl={(experience as any).vrImage || "https://upload.wikimedia.org/wikipedia/commons/3/33/Spherical_panoramic_of_a_park_in_autumn.jpg"}
                text={(experience as any).vrText || "Find the red hazard orb!"}
                onComplete={(score) => setVrScore(score)}
              />
            )}
            {isPPEMinigame && (
              <PPECheckModule onComplete={() => advance()} />
            )}
            {needsChoice && (
              <div className="employee-stage-options">
                {stageOptions.map((option, index) => (
                  <button
                    className={stageAnswer === index ? "selected" : ""}
                    key={option}
                    onClick={() => setStageAnswer(index)}
                  >
                    <span>{String.fromCharCode(65 + index)}</span>
                    {option}
                  </button>
                ))}
              </div>
            )}
            {needsChoice && stageAnswer !== null && (
              <small
                className={
                  stageAnswer === stageAnswerKey
                    ? "stage-feedback-good"
                    : "stage-feedback-review"
                }
              >
                {stageAnswer === stageAnswerKey
                  ? "Good choice. Continue when ready."
                  : "Review the safe principle, then continue."}
              </small>
            )}
          </div>
          {!isPPEMinigame && (
            <button
              className="portal-primary"
              disabled={needsChoice && stageAnswer === null}
              onClick={advance}
            >
              {journeyStep < 4
                ? `Complete ${journey[journeyStep]}`
                : "Start five-question quiz"}
              <IconArrowRight />
            </button>
          )}
        </article>
      </section>
    );
  }
  if (route === "results") {
    const result = quizResult;
    return (
      <section className="employee-results">
        <PortalHeading
          eyebrow="EMPLOYEE / RESULTS"
          title="Quiz result"
          text={
            result
              ? `Feedback for ${result.topicTitle}.`
              : "Review your saved quiz results."
          }
        />
        {result ? (
          <div className="quiz-result-card">
            <strong>{result.score} / 5</strong>
            <span>{result.percentage}%</span>
            <p>
              {result.correctAnswers} correct · {result.incorrectAnswers}{" "}
              incorrect
            </p>
            <b>{result.completionStatus}</b>
            <small>Review each answer to reinforce the safe decision.</small>
            <div className="quiz-feedback-list">
              {parsedQuestions.map(item => {
                const submitted = result.answers.find(
                  answer => answer.questionId === item.id
                );
                return (
                  <div
                    className={`quiz-feedback-row ${submitted?.isCorrect ? "correct" : "incorrect"}`}
                    key={item.id}
                  >
                    <strong>
                      {submitted?.isCorrect ? "Correct" : "Review"}:{" "}
                      {item.prompt}
                    </strong>
                    <span>
                      Your answer:{" "}
                      {submitted
                        ? item.options[submitted.selectedOption]
                        : "Not answered"}
                    </span>
                    <small>{item.explanation}</small>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="quiz-history-list">
            {previousAttempts.length ? (
              previousAttempts.slice(0, 5).map(attempt => (
                <div
                  className="quiz-history-row"
                  key={`${attempt.topicKey}-${attempt.createdAt}`}
                >
                  <strong>{attempt.topicTitle}</strong>
                  <span>
                    {attempt.score} / 5 · {attempt.percentage}%
                  </span>
                </div>
              ))
            ) : (
              <p>No quiz results yet. Start a topic to begin.</p>
            )}
          </div>
        )}
        <button className="portal-primary" onClick={() => go("progress")}>
          My progress
          <IconArrowRight />
        </button>
      </section>
    );
  }
  return (
    <EmployeeProgress records={records} previousAttempts={previousAttempts} />
  );
}

function EmployeeProgress({
  records,
  previousAttempts,
}: {
  records: TopicRecord[];
  previousAttempts: Array<{
    topicKey: string;
    topicTitle: string;
    score: number;
    percentage: number;
    correctAnswers: number;
    incorrectAnswers: number;
    completionStatus: string;
    createdAt?: string | Date;
  }>;
}) {
  const topics = managerTopics.map(topic => {
    const record = records.find(item => item.topicKey === topic.key);
    const attempt = previousAttempts.find(item => item.topicKey === topic.key);
    const progress = record?.progressPercent ?? 0;
    const status =
      progress === 100
        ? "Completed"
        : progress > 0
          ? "In Progress"
          : "Not Started";
    const score = record?.latestScore ?? attempt?.percentage ?? null;
    return { ...topic, progress, status, score };
  });
  const completed = topics.filter(topic => topic.status === "Completed").length;
  const inProgress = topics.filter(
    topic => topic.status === "In Progress"
  ).length;
  return (
    <section className="employee-progress-page">
      <PortalHeading
        eyebrow="EMPLOYEE / MY PROGRESS"
        title="Your learning progress"
        text="Track completion and quiz scores across all six SafeShift topics."
      />
      <div className="employee-progress-summary">
        <div>
          <strong>{completed}</strong>
          <span>Completed</span>
        </div>
        <div>
          <strong>{inProgress}</strong>
          <span>In progress</span>
        </div>
        <div>
          <strong>{topics.length - completed - inProgress}</strong>
          <span>Not started</span>
        </div>
      </div>
      <div className="employee-progress-list">
        {topics.map(topic => (
          <article className="employee-progress-row" key={topic.key}>
              <div className="employee-progress-icon">
                {topic.status === "Completed" ? (
                  <IconCheckCircle />
                ) : topic.status === "In Progress" ? (
                  <IconClock />
                ) : (
                  <IconCircleDashed />
                )}
              </div>
              <div className="employee-progress-topic">
                <strong>{topic.title}</strong>
                <small>
                  {topic.status === "Completed" && topic.score !== null
                    ? `Quiz score: ${topic.score}%`
                    : topic.status === "In Progress"
                      ? "Quiz in progress"
                      : "Begin this topic from Training"}
                </small>
              </div>
              <div className="employee-progress-state">
                <span
                  className={`employee-progress-status progress-status-${topic.status.toLowerCase().replace(" ", "-")}`}
                >
                  {topic.status}
                </span>
                {topic.status === "Completed" && topic.score !== null && (
                  <strong>{topic.score}%</strong>
                )}
              </div>
              <div className="employee-progress-bar">
                <span style={{ width: `${topic.progress}%` }} />
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}

function buildManagerEmployees(records: TopicRecord[]): ManagerEmployee[] {
  const map = new Map<string, TopicRecord[]>();
  records.forEach((record: TopicRecord) => {
    const key = record.employeeEmail.trim().toLowerCase();
    map.set(key, [...(map.get(key) || []), record]);
  });
  return Array.from(map.entries()).map(
    ([email, employeeRecords]: [string, TopicRecord[]]) => {
      const completion = Math.round(
        managerTopics.reduce(
          (sum, topic) =>
            sum +
            (employeeRecords.find(
              (record: TopicRecord) => record.topicKey === topic.key
            )?.progressPercent || 0),
          0
        ) / managerTopics.length
      );
      const latestScore =
        employeeRecords
          .filter(
            (record: TopicRecord) =>
              record.latestScore !== null && record.latestScore !== undefined
          )
          .sort(
            (a: TopicRecord, b: TopicRecord) =>
              b.updatedAt.getTime() - a.updatedAt.getTime()
          )[0]?.latestScore ?? null;
      const incomplete = managerTopics
        .filter(
          topic =>
            (employeeRecords.find(
              (record: TopicRecord) => record.topicKey === topic.key
            )?.progressPercent || 0) < 100
        )
        .map(topic => topic.title);
      return {
        email,
        name:
          employeeRecords.find((record: TopicRecord) => record.displayName)
            ?.displayName || "Employee",
        records: employeeRecords,
        completion,
        latestScore,
        incomplete,
        status:
          completion === 100
            ? "Completed"
            : completion > 0
              ? "In Progress"
              : "Not Started",
      };
    }
  );
}

function ManagerRoute({
  route,
  go,
  session,
  records,
  loading,
  selectedEmployee,
  onSelectEmployee,
}: {
  route: PortalRoute;
  go: PortalNavigate;
  session: Session;
  records: TopicRecord[];
  loading: boolean;
  selectedEmployee: string | null;
  onSelectEmployee: (email: string | null) => void;
}) {
  const employees = buildManagerEmployees(records);
  const selected = employees.find(
    employee => employee.email === selectedEmployee
  );
  if (loading)
    return <div className="manager-loading">Loading employee records…</div>;
  return (
    <section className="manager-shell">
      <aside className="manager-sidebar">
        <div className="manager-sidebar-heading">
          <span>MANAGER</span>
          <strong>SafeShift oversight</strong>
        </div>
        <div className="manager-sidebar-nav">
          <ManagerNavButton
            icon={<IconDashboard />}
            label="Dashboard"
            active={route === "manager-dashboard"}
            onClick={() => go("manager-dashboard")}
          />
          <ManagerNavButton
            icon={<IconUsers />}
            label="Employee Progress"
            active={route === "manager-progress"}
            onClick={() => go("manager-progress")}
          />
          <ManagerNavButton
            icon={<IconCheckCircle />}
            label="Training Completion"
            active={route === "manager-completion"}
            onClick={() => go("manager-completion")}
          />
          <ManagerNavButton
            icon={<IconUser />}
            label="Profile"
            active={route === "manager-profile"}
            onClick={() => go("manager-profile")}
          />
        </div>
        <div className="manager-sidebar-note">
          <IconActivity />
          <span>View-only reporting</span>
        </div>
      </aside>
      <div className="manager-content">
        {selected ? (
          <ManagerEmployeeDetails
            employee={selected}
            onBack={() => onSelectEmployee(null)}
          />
        ) : route === "manager-dashboard" ? (
          <ManagerOverview
            employees={employees}
            records={records}
            onSelectEmployee={onSelectEmployee}
          />
        ) : route === "manager-progress" || route === "manager-results" ? (
          <ManagerProgressPage
            employees={employees}
            records={records}
            onSelectEmployee={onSelectEmployee}
            resultsOnly={route === "manager-results"}
          />
        ) : route === "manager-completion" ? (
          <ManagerCompletionPage employees={employees} records={records} />
        ) : (
          <ManagerProfile session={session} />
        )}
      </div>
    </section>
  );
}

function ManagerOverview({
  employees,
  records,
  onSelectEmployee,
}: {
  employees: ManagerEmployee[];
  records: TopicRecord[];
  onSelectEmployee: (email: string) => void;
}) {
  const total = Math.max(TOTAL_WORKFORCE, employees.length);
  const completed = employees.filter(
    employee => employee.status === "Completed"
  ).length;
  const inProgress = employees.filter(
    employee => employee.status === "In Progress"
  ).length;
  const notStarted = Math.max(total - completed - inProgress, 0);
  const overall = total
    ? Math.round(
        employees.reduce((sum, employee) => sum + employee.completion, 0) /
          total
      )
    : 0;
  return (
    <>
      <ManagerPageHeader
        eyebrow="MANAGER DASHBOARD"
        title="Training overview"
        text="Monitor employee readiness, completion, and outstanding learning from one view."
      />
      <div className="manager-stat-grid">
        <ManagerStat
          icon={<IconUsers />}
          label="Total Employees"
          value={total}
          tone="blue"
        />
        <ManagerStat
          icon={<IconCheckCircle />}
          label="Completed Training"
          value={completed}
          tone="green"
        />
        <ManagerStat
          icon={<IconTrendUp />}
          label="In Progress"
          value={inProgress}
          tone="amber"
        />
        <ManagerStat
          icon={<IconCircleDashed />}
          label="Not Started"
          value={notStarted}
          tone="slate"
        />
      </div>
      <div className="manager-dashboard-grid">
        <section className="manager-panel manager-wide-panel">
          <div className="manager-panel-title">
            <div>
              <span>TEAM SNAPSHOT</span>
              <h2>Overall Training Completion</h2>
            </div>
            <strong>{overall}%</strong>
          </div>
          <div className="manager-progress-track">
            <span style={{ width: `${overall}%` }} />
          </div>
          <p className="manager-panel-caption">
            {overall}% completed across the six SafeShift training topics.
          </p>
        </section>
        <section className="manager-panel">
          <div className="manager-panel-title">
            <div>
              <span>ACTIVITY</span>
              <h2>Recent Activity</h2>
            </div>
          </div>
          <RecentActivity records={records} />
        </section>
        <section className="manager-panel manager-wide-panel">
          <div className="manager-panel-title">
            <div>
              <span>TOPIC BREAKDOWN</span>
              <h2>Training Topic Completion</h2>
            </div>
          </div>
          <TopicCompletion employees={employees} />
        </section>
        <section className="manager-panel">
          <div className="manager-panel-title">
            <div>
              <span>ATTENTION NEEDED</span>
              <h2>Outstanding Training</h2>
            </div>
          </div>
          <OutstandingTraining employees={employees} />
        </section>
      </div>
      <section className="manager-panel manager-table-panel">
        <div className="manager-panel-title">
          <div>
            <span>EMPLOYEE PROGRESS</span>
            <h2>Employee Progress</h2>
          </div>
          <button
            className="manager-text-button"
            onClick={() =>
              document
                .getElementById("manager-progress-table")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            View all
          </button>
        </div>
        <EmployeeProgressTable
          employees={employees}
          onSelectEmployee={onSelectEmployee}
          compact
        />
      </section>
    </>
  );
}

function ManagerProgressPage({
  employees,
  records,
  onSelectEmployee,
  resultsOnly,
}: {
  employees: ManagerEmployee[];
  records: TopicRecord[];
  onSelectEmployee: (email: string) => void;
  resultsOnly: boolean;
}) {
  return (
    <>
      <ManagerPageHeader
        eyebrow={
          resultsOnly ? "MANAGER / RESULTS" : "MANAGER / EMPLOYEE PROGRESS"
        }
        title={resultsOnly ? "Quiz results" : "Employee progress"}
        text={
          resultsOnly
            ? "Review saved quiz scores without editing employee outcomes."
            : "View each employee’s saved training progress and status."
        }
      />
      <section
        id="manager-progress-table"
        className="manager-panel manager-table-panel"
      >
        <EmployeeProgressTable
          employees={employees}
          onSelectEmployee={onSelectEmployee}
          resultsOnly={resultsOnly}
        />
        <small className="manager-readonly-note">
          Managers can view records only. Scores, content, and system settings
          are not editable here.
        </small>
      </section>
      {!resultsOnly && (
        <section className="manager-panel manager-activity-panel">
          <div className="manager-panel-title">
            <div>
              <span>RECENT ACTIVITY</span>
              <h2>Latest updates</h2>
            </div>
          </div>
          <RecentActivity records={records} />
        </section>
      )}
    </>
  );
}

function ManagerCompletionPage({
  employees,
  records,
}: {
  employees: ManagerEmployee[];
  records: TopicRecord[];
}) {
  const total = Math.max(TOTAL_WORKFORCE, employees.length);
  const overall = total
    ? Math.round(
        employees.reduce((sum, employee) => sum + employee.completion, 0) /
          total
      )
    : 0;
  return (
    <>
      <ManagerPageHeader
        eyebrow="MANAGER / TRAINING COMPLETION"
        title="Training completion"
        text="Compare completion across all SafeShift topics and employees."
      />
      <section className="manager-panel manager-wide-panel">
        <div className="manager-panel-title">
          <div>
            <span>OVERALL COMPLETION</span>
            <h2>Team completion</h2>
          </div>
          <strong>{overall}%</strong>
        </div>
        <div className="manager-progress-track">
          <span style={{ width: `${overall}%` }} />
        </div>
        <p className="manager-panel-caption">
          Calculated from the six topics in the Manager report.
        </p>
      </section>
      <section className="manager-panel manager-wide-panel">
        <div className="manager-panel-title">
          <div>
            <span>TOPIC BREAKDOWN</span>
            <h2>Completion by topic</h2>
          </div>
        </div>
        <TopicCompletion employees={employees} />
      </section>
      <section className="manager-panel manager-wide-panel">
        <div className="manager-panel-title">
          <div>
            <span>COMPLETION LOG</span>
            <h2>Recent completions</h2>
          </div>
        </div>
        <RecentActivity records={records} completedOnly />
      </section>
    </>
  );
}

function ManagerProfile({ session }: { session: Session }) {
  return (
    <>
      <ManagerPageHeader
        eyebrow="MANAGER / PROFILE"
        title="Manager profile"
        text="Your account has view-only access to SafeShift reporting."
      />
      <section className="manager-panel manager-profile-card">
        <div className="manager-profile-avatar">M</div>
        <div>
          <span>ACCOUNT</span>
          <h2>{session.name || "Manager"}</h2>
          <p>{session.email}</p>
        </div>
        <div className="manager-profile-badge">View only</div>
      </section>
    </>
  );
}

function EmployeeProgressTable({
  employees,
  onSelectEmployee,
  compact = false,
  resultsOnly = false,
}: {
  employees: ManagerEmployee[];
  onSelectEmployee: (email: string) => void;
  compact?: boolean;
  resultsOnly?: boolean;
}) {
  if (!employees.length)
    return (
      <div className="manager-empty">
        <IconUsers />
        <strong>No employee records yet</strong>
        <p>
          Employee progress will appear here after an employee begins training.
        </p>
      </div>
    );
  return (
    <div className={`manager-table-wrap ${compact ? "compact" : ""}`}>
      <table className="manager-table">
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Training Progress</th>
            <th>Latest Score</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(employee => (
            <tr key={employee.email}>
              <td>
                <strong>{employee.name}</strong>
                <small>{employee.email}</small>
              </td>
              <td>
                <div className="table-progress">
                  <span style={{ width: `${employee.completion}%` }} />
                </div>
                <b>{employee.completion}%</b>
              </td>
              <td>
                {employee.latestScore === null ? (
                  <span className="muted-cell">No result yet</span>
                ) : (
                  `${employee.latestScore}%`
                )}
              </td>
              <td>
                <span
                  className={`manager-status status-${employee.status.toLowerCase().replace(" ", "-")}`}
                >
                  {resultsOnly && employee.latestScore === null
                    ? "No result"
                    : employee.status}
                </span>
              </td>
              <td>
                <button
                  className="manager-view-button"
                  onClick={() => onSelectEmployee(employee.email)}
                >
                  <IconEye /> View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ManagerEmployeeDetails({
  employee,
  onBack,
}: {
  employee: ManagerEmployee;
  onBack: () => void;
}) {
  const completed = managerTopics.filter(
    topic =>
      employee.records.find(record => record.topicKey === topic.key)
        ?.progressPercent === 100
  );
  const inProgress = managerTopics.filter(topic => {
    const progress =
      employee.records.find(record => record.topicKey === topic.key)
        ?.progressPercent || 0;
    return progress > 0 && progress < 100;
  });
  const notStarted = managerTopics.filter(
    topic =>
      !employee.records.find(record => record.topicKey === topic.key)
        ?.progressPercent
  );
  return (
    <>
      <button className="manager-back-link" onClick={onBack}>
        <IconArrowLeft /> Back to employee progress
      </button>
      <ManagerPageHeader
        eyebrow="EMPLOYEE DETAILS"
        title={employee.name}
        text={employee.email}
      />
      <div className="manager-detail-summary">
        <div>
          <span>OVERALL COMPLETION</span>
          <strong>{employee.completion}%</strong>
        </div>
        <div>
          <span>LATEST SCORE</span>
          <strong>
            {employee.latestScore === null ? "—" : `${employee.latestScore}%`}
          </strong>
        </div>
        <div>
          <span>STATUS</span>
          <strong>{employee.status}</strong>
        </div>
      </div>
      <div className="manager-detail-grid">
        <DetailTopicList
          title="Completed training topics"
          topics={completed}
          employee={employee}
          tone="complete"
        />
        <DetailTopicList
          title="Training topics in progress"
          topics={inProgress}
          employee={employee}
          tone="progress"
        />
        <DetailTopicList
          title="Training topics not started"
          topics={notStarted}
          employee={employee}
          tone="empty"
        />
      </div>
    </>
  );
}

function DetailTopicList({
  title,
  topics,
  employee,
  tone,
}: {
  title: string;
  topics: typeof managerTopics;
  employee: ManagerEmployee;
  tone: "complete" | "progress" | "empty";
}) {
  return (
    <section className="manager-panel detail-topic-panel">
      <h2>{title}</h2>
      {topics.length ? (
        topics.map(topic => {
          const record = employee.records.find(
            item => item.topicKey === topic.key
          );
          return (
            <div className="detail-topic-row" key={topic.key}>
              <div>
                <strong>{topic.title}</strong>
                <small>
                  {record?.latestScore === null ||
                  record?.latestScore === undefined
                    ? "No quiz result"
                    : `Quiz score: ${record.latestScore}%`}
                  {record?.vrScore !== null && record?.vrScore !== undefined && ` · VR hazard found!`}
                </small>
              </div>
              <div className={`detail-topic-mark detail-${tone}`}>
                {record?.completedAt
                  ? new Date(record.completedAt).toLocaleDateString()
                  : record
                    ? `${record.progressPercent}%`
                    : "—"}
              </div>
            </div>
          );
        })
      ) : (
        <p className="manager-empty-inline">None recorded.</p>
      )}
    </section>
  );
}

function TopicCompletion({ employees }: { employees: ManagerEmployee[] }) {
  const total = Math.max(TOTAL_WORKFORCE, employees.length);
  return (
    <div className="topic-completion-list">
      {managerTopics.map(topic => {
        const completed = employees.filter(
          employee =>
            employee.records.find(record => record.topicKey === topic.key)
              ?.progressPercent === 100
        ).length;
        const percentage = total ? Math.round((completed / total) * 100) : 0;
        return (
          <div className="topic-completion-row" key={topic.key}>
            <div>
              <strong>{topic.title}</strong>
              <b>{percentage}%</b>
            </div>
            <div className="manager-progress-track">
              <span style={{ width: `${percentage}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
function OutstandingTraining({ employees }: { employees: ManagerEmployee[] }) {
  const outstanding = employees.filter(employee => employee.incomplete.length);
  if (!outstanding.length)
    return (
      <div className="manager-empty-inline">
        No outstanding training recorded.
      </div>
    );
  return (
    <div className="outstanding-list">
      {outstanding.slice(0, 5).map(employee => (
        <div className="outstanding-row" key={employee.email}>
          <div>
            <strong>{employee.name}</strong>
            <small>
              {employee.incomplete.slice(0, 2).join(" · ")}
              {employee.incomplete.length > 2 ? " …" : ""}
            </small>
          </div>
          <span>{employee.status}</span>
        </div>
      ))}
    </div>
  );
}
function RecentActivity({
  records,
  completedOnly = false,
}: {
  records: TopicRecord[];
  completedOnly?: boolean;
}) {
  const activity = records
    .filter(record => !completedOnly || record.completedAt)
    .sort(
      (a: TopicRecord, b: TopicRecord) =>
        b.updatedAt.getTime() - a.updatedAt.getTime()
    )
    .slice(0, 4);
  if (!activity.length)
    return (
      <div className="manager-empty-inline">No activity recorded yet.</div>
    );
  return (
    <div className="activity-list">
      {activity.map((record: TopicRecord) => (
        <div
          className="activity-row"
          key={`${record.id}-${record.updatedAt.toISOString()}`}
        >
          <span className="activity-dot" />
          <div>
            <strong>
              {record.displayName || "Employee"}{" "}
              {record.completedAt
                ? "completed"
                : record.progressPercent > 0
                  ? "started"
                  : "opened"}{" "}
              {managerTopics.find(topic => topic.key === record.topicKey)
                ?.title || record.topicTitle}
            </strong>
            <small>{new Date(record.updatedAt).toLocaleString()}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
function ManagerNavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`manager-nav-button ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
      <IconArrowRight />
    </button>
  );
}
function ManagerStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className={`manager-stat manager-stat-${tone}`}>
      <div className="manager-stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}


function PortalHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="portal-heading">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}
function ManagerPageHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="manager-page-header">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      <div className="manager-view-chip">
        <IconEye /> View only
      </div>
    </div>
  );
}

