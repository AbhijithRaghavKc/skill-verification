import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function calculateMatchScore(
  candidateSkills: { skillId: string; level: number; verified: boolean }[],
  requiredSkills: { skillId: string; minLevel: number }[],
  preferredSkills: { skillId: string; minLevel: number }[]
): number {
  if (requiredSkills.length === 0) return 0;

  let totalScore = 0;
  let maxScore = 0;

  for (const req of requiredSkills) {
    maxScore += 100;
    const candidate = candidateSkills.find((s) => s.skillId === req.skillId);
    if (candidate) {
      const levelMatch = Math.min(candidate.level / req.minLevel, 1) * 80;
      const verifiedBonus = candidate.verified ? 20 : 0;
      totalScore += levelMatch + verifiedBonus;
    }
  }

  for (const pref of preferredSkills) {
    maxScore += 50;
    const candidate = candidateSkills.find((s) => s.skillId === pref.skillId);
    if (candidate) {
      const levelMatch = Math.min(candidate.level / pref.minLevel, 1) * 40;
      const verifiedBonus = candidate.verified ? 10 : 0;
      totalScore += levelMatch + verifiedBonus;
    }
  }

  return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
}

export function generateAssessmentQuestions(
  skillName: string,
  difficulty: string,
  count: number
): {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}[] {
  const questions = getQuestionBank(skillName, difficulty);
  const shuffled = questions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getQuestionBank(
  skillName: string,
  difficulty: string
): {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}[] {
  const banks: Record<string, Record<string, ReturnType<typeof getQuestionBank>>> = {
    JavaScript: {
      beginner: [
        { id: "js-b-1", question: "What is the output of typeof null?", options: ["null", "undefined", "object", "boolean"], correctAnswer: 2, explanation: "typeof null returns 'object' due to a historical bug in JavaScript.", points: 10 },
        { id: "js-b-2", question: "Which method converts a JSON string to a JavaScript object?", options: ["JSON.stringify()", "JSON.parse()", "JSON.convert()", "JSON.toObject()"], correctAnswer: 1, explanation: "JSON.parse() parses a JSON string and constructs the JavaScript value.", points: 10 },
        { id: "js-b-3", question: "What does the === operator check?", options: ["Value only", "Type only", "Value and type", "Reference"], correctAnswer: 2, explanation: "The strict equality operator checks both value and type.", points: 10 },
        { id: "js-b-4", question: "Which keyword declares a block-scoped variable?", options: ["var", "let", "both", "neither"], correctAnswer: 1, explanation: "let declares a block-scoped local variable.", points: 10 },
        { id: "js-b-5", question: "What is a closure in JavaScript?", options: ["A loop structure", "A function with access to outer scope", "An object method", "A class constructor"], correctAnswer: 1, explanation: "A closure is a function that retains access to its lexical scope.", points: 10 },
      ],
      intermediate: [
        { id: "js-i-1", question: "What is the event loop responsible for?", options: ["DOM rendering", "Managing async operations", "Memory allocation", "Type checking"], correctAnswer: 1, explanation: "The event loop handles asynchronous callbacks in JavaScript.", points: 15 },
        { id: "js-i-2", question: "What does Promise.all() return if one promise rejects?", options: ["All results", "Partial results", "Rejected promise", "Undefined"], correctAnswer: 2, explanation: "Promise.all() rejects immediately if any promise rejects.", points: 15 },
        { id: "js-i-3", question: "What is the purpose of the Symbol type?", options: ["Mathematical operations", "Unique identifiers", "String formatting", "Array indexing"], correctAnswer: 1, explanation: "Symbols create unique identifiers for object properties.", points: 15 },
        { id: "js-i-4", question: "What pattern does async/await implement?", options: ["Observer", "Iterator", "Promise-based flow", "Singleton"], correctAnswer: 2, explanation: "async/await is syntactic sugar over Promises for cleaner async code.", points: 15 },
        { id: "js-i-5", question: "What is the Temporal Dead Zone?", options: ["Memory leak area", "Period before let/const initialization", "Garbage collection phase", "Event loop stage"], correctAnswer: 1, explanation: "The TDZ is the period between entering scope and variable declaration.", points: 15 },
      ],
      advanced: [
        { id: "js-a-1", question: "What is the difference between WeakMap and Map?", options: ["No difference", "WeakMap keys are weakly held", "WeakMap is faster", "Map uses more memory"], correctAnswer: 1, explanation: "WeakMap holds weak references to keys, allowing garbage collection.", points: 20 },
        { id: "js-a-2", question: "What does Object.freeze() NOT prevent?", options: ["Adding properties", "Modifying nested objects", "Deleting properties", "Changing values"], correctAnswer: 1, explanation: "Object.freeze() is shallow; nested objects can still be modified.", points: 20 },
        { id: "js-a-3", question: "What is a generator function?", options: ["A factory function", "A function that can pause execution", "A constructor", "An async function"], correctAnswer: 1, explanation: "Generators can pause and resume execution using yield.", points: 20 },
        { id: "js-a-4", question: "What is the Proxy object used for?", options: ["Network requests", "Intercepting object operations", "Worker threads", "Module loading"], correctAnswer: 1, explanation: "Proxy enables custom behavior for fundamental object operations.", points: 20 },
        { id: "js-a-5", question: "What is tail call optimization?", options: ["Loop unrolling", "Reusing stack frame for tail-position calls", "Caching results", "Lazy evaluation"], correctAnswer: 1, explanation: "TCO reuses the current stack frame for function calls in tail position.", points: 20 },
      ],
    },
    Python: {
      beginner: [
        { id: "py-b-1", question: "What is the output of type([])?", options: ["<class 'array'>", "<class 'list'>", "<class 'tuple'>", "<class 'set'>"], correctAnswer: 1, explanation: "[] creates a list in Python.", points: 10 },
        { id: "py-b-2", question: "How do you create a dictionary in Python?", options: ["[]", "()", "{}", "<>"], correctAnswer: 2, explanation: "Curly braces {} are used to create dictionaries.", points: 10 },
        { id: "py-b-3", question: "What does len() return for a string?", options: ["Word count", "Character count", "Byte count", "Line count"], correctAnswer: 1, explanation: "len() returns the number of characters in a string.", points: 10 },
        { id: "py-b-4", question: "What keyword starts a function definition?", options: ["function", "func", "def", "fn"], correctAnswer: 2, explanation: "The def keyword is used to define functions in Python.", points: 10 },
        { id: "py-b-5", question: "Which operator is used for exponentiation?", options: ["^", "**", "^^", "exp"], correctAnswer: 1, explanation: "** is the exponentiation operator in Python.", points: 10 },
      ],
      intermediate: [
        { id: "py-i-1", question: "What is a decorator in Python?", options: ["A design pattern", "A function that modifies another function", "A class method", "A type hint"], correctAnswer: 1, explanation: "Decorators wrap functions to modify their behavior.", points: 15 },
        { id: "py-i-2", question: "What is the GIL?", options: ["A package manager", "Global Interpreter Lock", "A testing framework", "A data structure"], correctAnswer: 1, explanation: "The GIL prevents multiple threads from executing Python code simultaneously.", points: 15 },
        { id: "py-i-3", question: "What is a list comprehension?", options: ["A loop", "A concise way to create lists", "A sorting algorithm", "A class method"], correctAnswer: 1, explanation: "List comprehensions provide a compact syntax for creating lists.", points: 15 },
        { id: "py-i-4", question: "What does yield do in a function?", options: ["Returns and exits", "Pauses and produces a value", "Raises an error", "Creates a class"], correctAnswer: 1, explanation: "yield pauses the function and returns a value to the caller.", points: 15 },
        { id: "py-i-5", question: "What is the difference between __str__ and __repr__?", options: ["No difference", "__str__ is for users, __repr__ for developers", "__repr__ is deprecated", "__str__ is faster"], correctAnswer: 1, explanation: "__str__ is for readable output; __repr__ is for unambiguous representation.", points: 15 },
      ],
      advanced: [
        { id: "py-a-1", question: "What is a metaclass?", options: ["A base class", "A class of a class", "An abstract class", "A mixin"], correctAnswer: 1, explanation: "Metaclasses define how classes themselves are created.", points: 20 },
        { id: "py-a-2", question: "What is the descriptor protocol?", options: ["Network protocol", "Object attribute access mechanism", "File I/O system", "Memory management"], correctAnswer: 1, explanation: "Descriptors define how attribute access is handled via __get__, __set__, __delete__.", points: 20 },
        { id: "py-a-3", question: "What is the MRO in Python?", options: ["Memory Reference Object", "Method Resolution Order", "Module Resource Optimizer", "Multi-Return Operation"], correctAnswer: 1, explanation: "MRO determines the order in which base classes are searched.", points: 20 },
        { id: "py-a-4", question: "What are slots in a Python class?", options: ["Method decorators", "Fixed attribute declarations", "Thread locks", "Memory pools"], correctAnswer: 1, explanation: "__slots__ prevents dynamic attribute creation, saving memory.", points: 20 },
        { id: "py-a-5", question: "What is monkey patching?", options: ["Error handling", "Dynamically modifying code at runtime", "Unit testing", "Code optimization"], correctAnswer: 1, explanation: "Monkey patching modifies or extends code at runtime without altering source.", points: 20 },
      ],
    },
    Solidity: {
      beginner: [
        { id: "sol-b-1", question: "What is a smart contract?", options: ["A legal document", "Self-executing code on blockchain", "A web API", "A database"], correctAnswer: 1, explanation: "Smart contracts are self-executing programs stored on a blockchain.", points: 10 },
        { id: "sol-b-2", question: "What is the primary unit of Ether?", options: ["Gwei", "Wei", "Finney", "Ether"], correctAnswer: 1, explanation: "Wei is the smallest unit of Ether (1 ETH = 10^18 Wei).", points: 10 },
        { id: "sol-b-3", question: "What visibility keyword makes a function accessible only within the contract?", options: ["public", "external", "private", "internal"], correctAnswer: 2, explanation: "private restricts access to the defining contract only.", points: 10 },
        { id: "sol-b-4", question: "What is msg.sender?", options: ["Contract address", "Current caller address", "Block miner", "Network ID"], correctAnswer: 1, explanation: "msg.sender is the address that called the current function.", points: 10 },
        { id: "sol-b-5", question: "What does the 'payable' modifier do?", options: ["Makes function free", "Allows function to receive Ether", "Adds logging", "Enables events"], correctAnswer: 1, explanation: "payable allows a function to receive Ether.", points: 10 },
      ],
      intermediate: [
        { id: "sol-i-1", question: "What is the purpose of the ERC-721 standard?", options: ["Fungible tokens", "Non-fungible tokens", "Governance", "Staking"], correctAnswer: 1, explanation: "ERC-721 is the standard for non-fungible tokens (NFTs).", points: 15 },
        { id: "sol-i-2", question: "What is a reentrancy attack?", options: ["DDoS attack", "Recursive call exploitation", "Phishing", "DNS hijacking"], correctAnswer: 1, explanation: "Reentrancy exploits recursive calls to drain funds before state updates.", points: 15 },
        { id: "sol-i-3", question: "What does the 'view' modifier indicate?", options: ["Function modifies state", "Function only reads state", "Function is deprecated", "Function is payable"], correctAnswer: 1, explanation: "view functions read state but do not modify it.", points: 15 },
        { id: "sol-i-4", question: "What is the purpose of events in Solidity?", options: ["Error handling", "Logging and external monitoring", "State mutation", "Access control"], correctAnswer: 1, explanation: "Events log data on the blockchain for external consumers.", points: 15 },
        { id: "sol-i-5", question: "What is gas in Ethereum?", options: ["A cryptocurrency", "Computational cost unit", "A consensus mechanism", "A data type"], correctAnswer: 1, explanation: "Gas measures the computational effort required to execute operations.", points: 15 },
      ],
      advanced: [
        { id: "sol-a-1", question: "What is the proxy pattern used for?", options: ["Gas optimization", "Upgradeable contracts", "Token creation", "Oracle integration"], correctAnswer: 1, explanation: "Proxy patterns enable contract upgradeability via delegatecall.", points: 20 },
        { id: "sol-a-2", question: "What is the difference between call and delegatecall?", options: ["No difference", "delegatecall preserves caller context", "call is deprecated", "delegatecall is faster"], correctAnswer: 1, explanation: "delegatecall executes code in the context of the calling contract.", points: 20 },
        { id: "sol-a-3", question: "What is the check-effects-interactions pattern?", options: ["A UI pattern", "Security pattern for state changes", "Testing methodology", "Gas optimization"], correctAnswer: 1, explanation: "This pattern prevents reentrancy by ordering checks, state changes, then external calls.", points: 20 },
        { id: "sol-a-4", question: "What is EIP-1967?", options: ["Token standard", "Proxy storage slot standard", "Governance protocol", "Bridge protocol"], correctAnswer: 1, explanation: "EIP-1967 standardizes storage slots for proxy contracts.", points: 20 },
        { id: "sol-a-5", question: "What is the diamond pattern (EIP-2535)?", options: ["Token standard", "Multi-facet proxy pattern", "NFT metadata standard", "Staking protocol"], correctAnswer: 1, explanation: "The diamond pattern allows unlimited contract functionality via facets.", points: 20 },
      ],
    },
    React: {
      beginner: [
        { id: "react-b-1", question: "What is JSX?", options: ["A database query language", "A syntax extension for JavaScript", "A CSS framework", "A testing library"], correctAnswer: 1, explanation: "JSX is a syntax extension that allows writing HTML-like code in JavaScript.", points: 10 },
        { id: "react-b-2", question: "What hook is used to manage state in a functional component?", options: ["useEffect", "useState", "useContext", "useRef"], correctAnswer: 1, explanation: "useState is the hook for adding state to functional components.", points: 10 },
        { id: "react-b-3", question: "What is a component in React?", options: ["A CSS class", "A reusable piece of UI", "A database model", "A routing mechanism"], correctAnswer: 1, explanation: "Components are reusable, self-contained pieces of UI.", points: 10 },
        { id: "react-b-4", question: "What does the 'key' prop do in a list?", options: ["Styles elements", "Helps React identify which items changed", "Sorts the list", "Filters items"], correctAnswer: 1, explanation: "Keys help React identify which items have changed, been added, or removed.", points: 10 },
        { id: "react-b-5", question: "How do you pass data from parent to child component?", options: ["State", "Props", "Context", "Refs"], correctAnswer: 1, explanation: "Props are the mechanism for passing data from parent to child components.", points: 10 },
      ],
      intermediate: [
        { id: "react-i-1", question: "What is the virtual DOM?", options: ["A browser API", "A lightweight copy of the real DOM", "A CSS engine", "A server-side concept"], correctAnswer: 1, explanation: "The virtual DOM is a lightweight JavaScript representation of the real DOM.", points: 15 },
        { id: "react-i-2", question: "When does useEffect run with an empty dependency array?", options: ["Every render", "Only on mount", "On unmount", "Never"], correctAnswer: 1, explanation: "useEffect with [] runs once after the initial render (mount).", points: 15 },
        { id: "react-i-3", question: "What is the purpose of React.memo?", options: ["Memory management", "Memoize component to prevent unnecessary re-renders", "Create memos", "Debug components"], correctAnswer: 1, explanation: "React.memo skips re-rendering if props haven't changed.", points: 15 },
        { id: "react-i-4", question: "What is context used for?", options: ["Routing", "Sharing data without prop drilling", "State management only", "API calls"], correctAnswer: 1, explanation: "Context provides a way to share values between components without explicit prop passing.", points: 15 },
        { id: "react-i-5", question: "What is a controlled component?", options: ["A component with error boundaries", "A form element whose value is controlled by React state", "A component with lifecycle methods", "A server component"], correctAnswer: 1, explanation: "Controlled components have their form data handled by React state.", points: 15 },
      ],
      advanced: [
        { id: "react-a-1", question: "What is concurrent rendering?", options: ["Server-side rendering", "Rendering that can be interrupted and resumed", "Multi-threaded rendering", "Parallel DOM updates"], correctAnswer: 1, explanation: "Concurrent rendering allows React to interrupt and resume rendering work.", points: 20 },
        { id: "react-a-2", question: "What is the purpose of useTransition?", options: ["CSS transitions", "Mark state updates as non-urgent", "Page navigation", "Animation control"], correctAnswer: 1, explanation: "useTransition lets you mark state updates as non-urgent transitions.", points: 20 },
        { id: "react-a-3", question: "What are React Server Components?", options: ["Components that run on the server only", "SSR components", "API routes", "Middleware"], correctAnswer: 0, explanation: "React Server Components render exclusively on the server, reducing client bundle size.", points: 20 },
        { id: "react-a-4", question: "What is reconciliation in React?", options: ["State merging", "The diffing algorithm for updating the DOM", "Component composition", "Error recovery"], correctAnswer: 1, explanation: "Reconciliation is React's algorithm for diffing two trees to determine needed DOM changes.", points: 20 },
        { id: "react-a-5", question: "What problem does Suspense solve?", options: ["Error handling", "Declaratively handling loading states", "Memory leaks", "Prop validation"], correctAnswer: 1, explanation: "Suspense lets you declaratively specify loading states for async operations.", points: 20 },
      ],
    },
    TypeScript: {
      beginner: [
        { id: "ts-b-1", question: "What is TypeScript?", options: ["A new programming language", "A typed superset of JavaScript", "A JavaScript framework", "A testing tool"], correctAnswer: 1, explanation: "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.", points: 10 },
        { id: "ts-b-2", question: "How do you define a variable with a specific type?", options: ["let x = number", "let x: number", "let number x", "number let x"], correctAnswer: 1, explanation: "TypeScript uses colon notation for type annotations: let x: number.", points: 10 },
        { id: "ts-b-3", question: "What is an interface in TypeScript?", options: ["A class implementation", "A contract that defines object structure", "A function type", "An import statement"], correctAnswer: 1, explanation: "Interfaces define contracts for object shapes and structures.", points: 10 },
        { id: "ts-b-4", question: "What does the 'any' type represent?", options: ["Only strings", "Only numbers", "Any type — opts out of type checking", "Null values"], correctAnswer: 2, explanation: "The 'any' type disables type checking for that variable.", points: 10 },
        { id: "ts-b-5", question: "What is a union type?", options: ["A merged object", "A type that can be one of several types", "An array type", "A class hierarchy"], correctAnswer: 1, explanation: "Union types allow a value to be one of several types using the | operator.", points: 10 },
      ],
      intermediate: [
        { id: "ts-i-1", question: "What is a generic in TypeScript?", options: ["A default type", "A parameterized type for reusable code", "A global variable", "An enum"], correctAnswer: 1, explanation: "Generics allow creating reusable components that work with multiple types.", points: 15 },
        { id: "ts-i-2", question: "What is the difference between 'type' and 'interface'?", options: ["No difference", "Types can use unions; interfaces can be extended", "Interfaces are faster", "Types are deprecated"], correctAnswer: 1, explanation: "Types support unions and intersections; interfaces support declaration merging and extends.", points: 15 },
        { id: "ts-i-3", question: "What is a type guard?", options: ["A security feature", "A runtime check that narrows types", "A compile-time validator", "A decorator"], correctAnswer: 1, explanation: "Type guards are runtime checks that narrow the type within a conditional block.", points: 15 },
        { id: "ts-i-4", question: "What does 'keyof' do?", options: ["Creates keys", "Produces a union of an object type's keys", "Deletes keys", "Validates keys"], correctAnswer: 1, explanation: "keyof produces a union type of all property names of a given type.", points: 15 },
        { id: "ts-i-5", question: "What is a mapped type?", options: ["A Map data structure", "A type that transforms properties of another type", "A GPS type", "An array method"], correctAnswer: 1, explanation: "Mapped types create new types by transforming each property of an existing type.", points: 15 },
      ],
      advanced: [
        { id: "ts-a-1", question: "What is a conditional type?", options: ["An if statement", "A type that depends on a condition: T extends U ? X : Y", "A ternary operator", "A switch type"], correctAnswer: 1, explanation: "Conditional types select one of two types based on a condition.", points: 20 },
        { id: "ts-a-2", question: "What is 'infer' used for in TypeScript?", options: ["Type inference at runtime", "Extracting types within conditional types", "Variable declaration", "Module import"], correctAnswer: 1, explanation: "infer declares a type variable within the extends clause of a conditional type.", points: 20 },
        { id: "ts-a-3", question: "What is a discriminated union?", options: ["A union with a shared literal property for narrowing", "A banned union", "A union of functions", "A recursive type"], correctAnswer: 0, explanation: "Discriminated unions use a common literal property to enable exhaustive type narrowing.", points: 20 },
        { id: "ts-a-4", question: "What is the 'satisfies' operator?", options: ["A comparison operator", "Validates a type without widening", "An assertion", "A cast operator"], correctAnswer: 1, explanation: "satisfies validates that an expression matches a type while preserving the narrowest type.", points: 20 },
        { id: "ts-a-5", question: "What are template literal types?", options: ["String templates", "Types that use template literal syntax for string manipulation", "JSX types", "Regex types"], correctAnswer: 1, explanation: "Template literal types build string types using template literal syntax.", points: 20 },
      ],
    },
    "Node.js": {
      beginner: [
        { id: "node-b-1", question: "What is Node.js?", options: ["A browser", "A JavaScript runtime built on V8", "A database", "A framework"], correctAnswer: 1, explanation: "Node.js is a JavaScript runtime built on Chrome's V8 engine for server-side execution.", points: 10 },
        { id: "node-b-2", question: "What is npm?", options: ["A programming language", "Node Package Manager", "A testing tool", "A database"], correctAnswer: 1, explanation: "npm is the default package manager for Node.js.", points: 10 },
        { id: "node-b-3", question: "What module is used for file operations?", options: ["http", "fs", "path", "os"], correctAnswer: 1, explanation: "The 'fs' (file system) module provides file operation APIs.", points: 10 },
        { id: "node-b-4", question: "What is package.json?", options: ["A config file describing the project and dependencies", "A JavaScript file", "A database schema", "A test file"], correctAnswer: 0, explanation: "package.json holds project metadata and dependency information.", points: 10 },
        { id: "node-b-5", question: "What is the purpose of require()?", options: ["HTTP requests", "Import modules", "Create variables", "Define routes"], correctAnswer: 1, explanation: "require() is the CommonJS function for importing modules.", points: 10 },
      ],
      intermediate: [
        { id: "node-i-1", question: "What is the event loop in Node.js?", options: ["A for loop", "Mechanism for handling async I/O", "A UI framework", "A database connection"], correctAnswer: 1, explanation: "The event loop enables non-blocking I/O by offloading operations to the system kernel.", points: 15 },
        { id: "node-i-2", question: "What is middleware in Express?", options: ["Database layer", "Functions that access request/response in the pipeline", "A template engine", "A router"], correctAnswer: 1, explanation: "Middleware functions have access to req, res, and next in the request-response cycle.", points: 15 },
        { id: "node-i-3", question: "What is a stream in Node.js?", options: ["A video player", "An abstract interface for working with streaming data", "A database query", "A file type"], correctAnswer: 1, explanation: "Streams are objects for reading/writing data in chunks, avoiding loading everything into memory.", points: 15 },
        { id: "node-i-4", question: "What is clustering in Node.js?", options: ["Database sharding", "Running multiple instances to utilize multi-core CPUs", "Load balancing", "Microservices"], correctAnswer: 1, explanation: "Clustering creates child processes sharing the same server port for multi-core utilization.", points: 15 },
        { id: "node-i-5", question: "What is the Buffer class?", options: ["A UI component", "A way to handle binary data", "A cache system", "A queue"], correctAnswer: 1, explanation: "Buffer handles binary data directly without going through the V8 heap.", points: 15 },
      ],
      advanced: [
        { id: "node-a-1", question: "What are worker threads?", options: ["Web workers", "Threads for CPU-intensive tasks without blocking the event loop", "Thread pool", "Background services"], correctAnswer: 1, explanation: "Worker threads enable parallel JavaScript execution for CPU-intensive operations.", points: 20 },
        { id: "node-a-2", question: "What is the difference between process.nextTick and setImmediate?", options: ["No difference", "nextTick runs before I/O callbacks, setImmediate after", "setImmediate is deprecated", "nextTick is slower"], correctAnswer: 1, explanation: "process.nextTick fires before I/O events; setImmediate fires after I/O events in the event loop.", points: 20 },
        { id: "node-a-3", question: "What is libuv?", options: ["A UV light library", "The C library providing the event loop and async I/O", "A logging library", "A HTTP client"], correctAnswer: 1, explanation: "libuv is the C library that provides Node.js with its event loop and async I/O capabilities.", points: 20 },
        { id: "node-a-4", question: "What are N-API and node-addon-api?", options: ["Testing frameworks", "Interfaces for building native C/C++ addons", "Package managers", "Debugging tools"], correctAnswer: 1, explanation: "N-API provides a stable ABI for building native addons across Node.js versions.", points: 20 },
        { id: "node-a-5", question: "What is the V8 garbage collector's strategy?", options: ["Reference counting", "Generational garbage collection with scavenge and mark-sweep", "Manual memory management", "Arena allocation"], correctAnswer: 1, explanation: "V8 uses generational GC: scavenge for young generation and mark-sweep/compact for old generation.", points: 20 },
      ],
    },
    Docker: {
      beginner: [
        { id: "dock-b-1", question: "What is Docker?", options: ["A virtual machine", "A containerization platform", "An operating system", "A programming language"], correctAnswer: 1, explanation: "Docker is a platform for building, shipping, and running applications in containers.", points: 10 },
        { id: "dock-b-2", question: "What is a Docker image?", options: ["A screenshot", "A read-only template for creating containers", "A virtual disk", "A backup file"], correctAnswer: 1, explanation: "A Docker image is a read-only template with instructions for creating a container.", points: 10 },
        { id: "dock-b-3", question: "What is a Dockerfile?", options: ["A config file", "A text file with instructions to build an image", "A log file", "A container"], correctAnswer: 1, explanation: "A Dockerfile contains instructions for building a Docker image.", points: 10 },
        { id: "dock-b-4", question: "What command runs a Docker container?", options: ["docker start", "docker run", "docker exec", "docker create"], correctAnswer: 1, explanation: "docker run creates and starts a new container from an image.", points: 10 },
        { id: "dock-b-5", question: "What is Docker Hub?", options: ["A Git repository", "A cloud registry for Docker images", "A CI/CD tool", "A monitoring service"], correctAnswer: 1, explanation: "Docker Hub is a cloud-based registry for sharing and managing Docker images.", points: 10 },
      ],
      intermediate: [
        { id: "dock-i-1", question: "What is docker-compose?", options: ["A text editor", "A tool for defining multi-container applications", "A build tool", "A testing framework"], correctAnswer: 1, explanation: "Docker Compose defines and runs multi-container Docker applications using YAML.", points: 15 },
        { id: "dock-i-2", question: "What is a Docker volume?", options: ["Sound control", "Persistent data storage for containers", "A network interface", "A CPU limit"], correctAnswer: 1, explanation: "Volumes persist data generated by and used by Docker containers.", points: 15 },
        { id: "dock-i-3", question: "What is the difference between CMD and ENTRYPOINT?", options: ["No difference", "CMD provides defaults; ENTRYPOINT defines the executable", "CMD is deprecated", "ENTRYPOINT is optional"], correctAnswer: 1, explanation: "ENTRYPOINT sets the main executable; CMD provides default arguments that can be overridden.", points: 15 },
        { id: "dock-i-4", question: "What is a multi-stage build?", options: ["Building multiple images", "Using multiple FROM statements to optimize image size", "Parallel builds", "CI/CD pipeline"], correctAnswer: 1, explanation: "Multi-stage builds use multiple FROM stages to create smaller final images.", points: 15 },
        { id: "dock-i-5", question: "What is a Docker network?", options: ["Internet connection", "Communication channel between containers", "VPN", "Firewall"], correctAnswer: 1, explanation: "Docker networks enable communication between containers and isolation from external networks.", points: 15 },
      ],
      advanced: [
        { id: "dock-a-1", question: "What is Docker Swarm?", options: ["A bug tracking tool", "Native container orchestration tool", "A monitoring system", "A CI/CD platform"], correctAnswer: 1, explanation: "Docker Swarm is Docker's native clustering and orchestration solution.", points: 20 },
        { id: "dock-a-2", question: "What are namespaces in Docker?", options: ["Variable scoping", "Linux kernel features providing isolation", "DNS resolution", "Package management"], correctAnswer: 1, explanation: "Namespaces provide the isolation that separates containers from each other and the host.", points: 20 },
        { id: "dock-a-3", question: "What are cgroups?", options: ["User groups", "Linux kernel feature limiting resource usage", "Container groups", "Network groups"], correctAnswer: 1, explanation: "cgroups limit, account for, and isolate resource usage (CPU, memory, I/O) of process groups.", points: 20 },
        { id: "dock-a-4", question: "What is the overlay filesystem?", options: ["A backup system", "A union filesystem for layered image storage", "A network overlay", "A logging system"], correctAnswer: 1, explanation: "The overlay filesystem layers multiple directories to create a unified view for containers.", points: 20 },
        { id: "dock-a-5", question: "What is BuildKit?", options: ["A UI framework", "Docker's next-generation build backend", "A testing tool", "A deployment tool"], correctAnswer: 1, explanation: "BuildKit is Docker's improved build backend with better caching, parallelism, and security.", points: 20 },
      ],
    },
    AWS: {
      beginner: [
        { id: "aws-b-1", question: "What does AWS stand for?", options: ["Advanced Web Services", "Amazon Web Services", "Automated Web System", "Application Web Server"], correctAnswer: 1, explanation: "AWS stands for Amazon Web Services.", points: 10 },
        { id: "aws-b-2", question: "What is S3 used for?", options: ["Compute", "Object storage", "Databases", "Networking"], correctAnswer: 1, explanation: "S3 (Simple Storage Service) is an object storage service.", points: 10 },
        { id: "aws-b-3", question: "What is EC2?", options: ["A database", "A virtual server in the cloud", "A storage service", "A CDN"], correctAnswer: 1, explanation: "EC2 (Elastic Compute Cloud) provides resizable compute capacity.", points: 10 },
        { id: "aws-b-4", question: "What is an AWS Region?", options: ["A data center", "A geographic area with multiple data centers", "A network zone", "A security group"], correctAnswer: 1, explanation: "An AWS Region is a physical location with multiple Availability Zones.", points: 10 },
        { id: "aws-b-5", question: "What is IAM?", options: ["A messaging service", "Identity and Access Management", "An API gateway", "A monitoring tool"], correctAnswer: 1, explanation: "IAM manages access to AWS services and resources securely.", points: 10 },
      ],
      intermediate: [
        { id: "aws-i-1", question: "What is a VPC?", options: ["A server type", "A Virtual Private Cloud", "A pricing plan", "A deployment tool"], correctAnswer: 1, explanation: "VPC lets you provision a logically isolated section of AWS Cloud.", points: 15 },
        { id: "aws-i-2", question: "What is Lambda?", options: ["A programming language", "A serverless compute service", "A database", "A container service"], correctAnswer: 1, explanation: "AWS Lambda runs code without provisioning or managing servers.", points: 15 },
        { id: "aws-i-3", question: "What is CloudFormation?", options: ["Weather service", "Infrastructure as Code service", "A CDN", "A logging tool"], correctAnswer: 1, explanation: "CloudFormation provisions AWS resources using declarative templates.", points: 15 },
        { id: "aws-i-4", question: "What is the difference between SQS and SNS?", options: ["No difference", "SQS is a queue; SNS is a pub/sub notification service", "SQS is deprecated", "SNS is a database"], correctAnswer: 1, explanation: "SQS is a message queue service; SNS is a push notification/pub-sub service.", points: 15 },
        { id: "aws-i-5", question: "What is DynamoDB?", options: ["A relational database", "A managed NoSQL database", "A file system", "A cache service"], correctAnswer: 1, explanation: "DynamoDB is a fully managed NoSQL key-value and document database.", points: 15 },
      ],
      advanced: [
        { id: "aws-a-1", question: "What is AWS Well-Architected Framework?", options: ["A UI framework", "Best practices for building on AWS across 6 pillars", "A deployment tool", "A testing methodology"], correctAnswer: 1, explanation: "The Well-Architected Framework provides best practices across security, reliability, performance, cost, operations, and sustainability.", points: 20 },
        { id: "aws-a-2", question: "What is the Shared Responsibility Model?", options: ["Team management", "AWS manages infrastructure security; customers manage their data and app security", "Cost sharing", "Resource pooling"], correctAnswer: 1, explanation: "AWS is responsible for security OF the cloud; customers are responsible for security IN the cloud.", points: 20 },
        { id: "aws-a-3", question: "What is AWS Organizations?", options: ["HR tool", "Centrally manage multiple AWS accounts", "Team chat", "Project management"], correctAnswer: 1, explanation: "AWS Organizations enables central management and governance of multiple AWS accounts.", points: 20 },
        { id: "aws-a-4", question: "What is AWS CDK?", options: ["A content delivery tool", "Cloud Development Kit for defining infrastructure in code", "A container service", "A CI/CD tool"], correctAnswer: 1, explanation: "CDK lets you define cloud infrastructure using familiar programming languages.", points: 20 },
        { id: "aws-a-5", question: "What is AWS Transit Gateway?", options: ["A migration tool", "A hub that connects VPCs and on-premises networks", "A CDN endpoint", "A DNS service"], correctAnswer: 1, explanation: "Transit Gateway acts as a hub to connect VPCs and on-premises networks through a central gateway.", points: 20 },
      ],
    },
    Rust: {
      beginner: [
        { id: "rust-b-1", question: "What is Rust's primary focus?", options: ["Web development", "Memory safety without garbage collection", "Mobile apps", "Database management"], correctAnswer: 1, explanation: "Rust focuses on memory safety and performance without a garbage collector.", points: 10 },
        { id: "rust-b-2", question: "What is ownership in Rust?", options: ["Software licensing", "A system where each value has a single owner", "File permissions", "User authentication"], correctAnswer: 1, explanation: "Ownership is Rust's system for managing memory: each value has exactly one owner.", points: 10 },
        { id: "rust-b-3", question: "What is cargo?", options: ["A shipping container", "Rust's package manager and build tool", "A web framework", "A testing tool"], correctAnswer: 1, explanation: "Cargo is Rust's official package manager and build system.", points: 10 },
        { id: "rust-b-4", question: "What does 'let mut' do?", options: ["Creates a constant", "Declares a mutable variable", "Imports a module", "Defines a function"], correctAnswer: 1, explanation: "let mut declares a variable that can be reassigned.", points: 10 },
        { id: "rust-b-5", question: "What is a crate in Rust?", options: ["A container", "A compilation unit / package", "A data type", "A macro"], correctAnswer: 1, explanation: "A crate is the smallest compilation unit in Rust — either a binary or a library.", points: 10 },
      ],
      intermediate: [
        { id: "rust-i-1", question: "What is borrowing in Rust?", options: ["Taking ownership", "Referencing data without taking ownership", "Copying data", "Allocating memory"], correctAnswer: 1, explanation: "Borrowing lets you reference data without taking ownership, enforced at compile time.", points: 15 },
        { id: "rust-i-2", question: "What is a lifetime in Rust?", options: ["Program runtime", "An annotation describing how long references are valid", "Memory allocation period", "Thread duration"], correctAnswer: 1, explanation: "Lifetimes ensure references don't outlive the data they point to.", points: 15 },
        { id: "rust-i-3", question: "What is pattern matching in Rust?", options: ["Regex", "A control flow construct using match expressions", "String comparison", "Type checking"], correctAnswer: 1, explanation: "Pattern matching with match provides exhaustive handling of all possible cases.", points: 15 },
        { id: "rust-i-4", question: "What is a trait?", options: ["A class", "A collection of methods defining shared behavior", "An interface file", "A module"], correctAnswer: 1, explanation: "Traits define shared behavior, similar to interfaces in other languages.", points: 15 },
        { id: "rust-i-5", question: "What is the Option type?", options: ["A settings object", "An enum representing a value or absence of value", "A boolean", "A result type"], correctAnswer: 1, explanation: "Option<T> is either Some(T) or None, replacing null in other languages.", points: 15 },
      ],
      advanced: [
        { id: "rust-a-1", question: "What is the borrow checker?", options: ["A linting tool", "A compile-time system enforcing ownership and borrowing rules", "A runtime validator", "A memory profiler"], correctAnswer: 1, explanation: "The borrow checker enforces ownership, borrowing, and lifetime rules at compile time.", points: 20 },
        { id: "rust-a-2", question: "What is unsafe Rust?", options: ["Buggy code", "A mode that allows operations the compiler can't verify as safe", "Deprecated features", "Unoptimized code"], correctAnswer: 1, explanation: "unsafe blocks allow dereferencing raw pointers, calling unsafe functions, and other unverified operations.", points: 20 },
        { id: "rust-a-3", question: "What is zero-cost abstraction?", options: ["Free hosting", "Abstractions that compile to code as efficient as hand-written", "No-op functions", "Lazy evaluation"], correctAnswer: 1, explanation: "Zero-cost abstractions compile down to the same code you'd write manually.", points: 20 },
        { id: "rust-a-4", question: "What is the Pin type used for?", options: ["GUI pinning", "Preventing a value from being moved in memory", "Thread pinning", "Version pinning"], correctAnswer: 1, explanation: "Pin<T> guarantees that the value it wraps won't be moved, crucial for self-referential types and async.", points: 20 },
        { id: "rust-a-5", question: "What is monomorphization?", options: ["Design pattern", "Generating specialized code for each concrete type used with generics", "Type erasure", "Serialization"], correctAnswer: 1, explanation: "Monomorphization creates concrete implementations for each type a generic is instantiated with.", points: 20 },
      ],
    },
    Go: {
      beginner: [
        { id: "go-b-1", question: "What is Go (Golang)?", options: ["A game", "A statically typed, compiled language by Google", "A JavaScript framework", "A database"], correctAnswer: 1, explanation: "Go is a statically typed, compiled language designed at Google for simplicity and efficiency.", points: 10 },
        { id: "go-b-2", question: "What is a goroutine?", options: ["A function type", "A lightweight thread managed by the Go runtime", "A package", "A data structure"], correctAnswer: 1, explanation: "Goroutines are lightweight threads managed by the Go runtime, much cheaper than OS threads.", points: 10 },
        { id: "go-b-3", question: "What is a channel in Go?", options: ["A TV channel", "A typed conduit for communication between goroutines", "A network connection", "A file descriptor"], correctAnswer: 1, explanation: "Channels provide a way for goroutines to communicate and synchronize.", points: 10 },
        { id: "go-b-4", question: "What does 'defer' do?", options: ["Delays compilation", "Schedules a function call to run when the surrounding function returns", "Creates a timer", "Handles errors"], correctAnswer: 1, explanation: "defer schedules a function to execute when the enclosing function returns.", points: 10 },
        { id: "go-b-5", question: "How does Go handle errors?", options: ["Exceptions", "Returning error values", "Try-catch", "Panic only"], correctAnswer: 1, explanation: "Go uses explicit error return values instead of exceptions.", points: 10 },
      ],
      intermediate: [
        { id: "go-i-1", question: "What is an interface in Go?", options: ["A GUI element", "A set of method signatures that a type can implement implicitly", "A config file", "A package"], correctAnswer: 1, explanation: "Go interfaces are satisfied implicitly — any type implementing the methods satisfies the interface.", points: 15 },
        { id: "go-i-2", question: "What is the difference between a slice and an array?", options: ["No difference", "Arrays are fixed-size; slices are dynamic references", "Slices are slower", "Arrays are deprecated"], correctAnswer: 1, explanation: "Arrays have fixed size; slices are dynamically-sized references to underlying arrays.", points: 15 },
        { id: "go-i-3", question: "What is a struct in Go?", options: ["A function", "A composite type that groups fields together", "A module", "An interface"], correctAnswer: 1, explanation: "Structs group fields together to create custom composite types.", points: 15 },
        { id: "go-i-4", question: "What is the 'select' statement?", options: ["SQL query", "Lets a goroutine wait on multiple channel operations", "A switch statement", "A loop"], correctAnswer: 1, explanation: "select blocks until one of its cases can proceed, enabling multiplexing on channels.", points: 15 },
        { id: "go-i-5", question: "What is the purpose of context.Context?", options: ["UI context", "Carrying deadlines, cancellation signals, and request-scoped values", "Database connections", "Logging"], correctAnswer: 1, explanation: "context.Context carries deadlines, cancellation signals, and request-scoped values across API boundaries.", points: 15 },
      ],
      advanced: [
        { id: "go-a-1", question: "What is the Go scheduler (GMP model)?", options: ["A cron tool", "Goroutine scheduling using G (goroutine), M (OS thread), P (processor)", "A task queue", "A build system"], correctAnswer: 1, explanation: "Go's GMP scheduler maps goroutines (G) to OS threads (M) via logical processors (P).", points: 20 },
        { id: "go-a-2", question: "What is escape analysis?", options: ["Security check", "Compiler analysis determining whether variables can stay on the stack", "Error detection", "Memory leak detection"], correctAnswer: 1, explanation: "Escape analysis determines if a variable can be allocated on the stack vs. the heap.", points: 20 },
        { id: "go-a-3", question: "What are generics in Go (1.18+)?", options: ["Code generation", "Type parameters enabling type-safe reusable code", "Reflection", "Macros"], correctAnswer: 1, explanation: "Go generics (1.18+) allow writing functions and types parameterized by type constraints.", points: 20 },
        { id: "go-a-4", question: "What is the sync.Pool used for?", options: ["Connection pooling", "Reusing temporary objects to reduce GC pressure", "Thread pool", "Memory pool"], correctAnswer: 1, explanation: "sync.Pool caches allocated but unused items for reuse, reducing garbage collection pressure.", points: 20 },
        { id: "go-a-5", question: "What is unsafe.Pointer?", options: ["A null pointer", "A pointer type that can be converted to any pointer type", "A smart pointer", "A weak reference"], correctAnswer: 1, explanation: "unsafe.Pointer bypasses Go's type system, allowing conversion between arbitrary pointer types.", points: 20 },
      ],
    },
  };

  const skillBank = banks[skillName] || banks["JavaScript"];
  const difficultyBank = skillBank?.[difficulty] || skillBank?.["beginner"];
  return difficultyBank || banks["JavaScript"]["beginner"];
}

export function analyzeAssessmentResults(
  answers: Record<string, number>,
  questions: {
    id: string;
    correctAnswer: number;
    points: number;
    question: string;
  }[]
): {
  score: number;
  passed: boolean;
  analysis: {
    strengthAreas: string[];
    weaknessAreas: string[];
    recommendations: string[];
    confidenceScore: number;
    detailedBreakdown: Record<string, number>;
  };
} {
  let totalPoints = 0;
  let earnedPoints = 0;
  const correctQuestions: string[] = [];
  const incorrectQuestions: string[] = [];
  let easyCorrect = 0;
  let easyTotal = 0;
  let hardCorrect = 0;
  let hardTotal = 0;

  for (const q of questions) {
    totalPoints += q.points;
    const isHard = q.points >= 20;
    const isEasy = q.points <= 10;
    if (answers[q.id] === q.correctAnswer) {
      earnedPoints += q.points;
      correctQuestions.push(q.question);
      if (isHard) hardCorrect++;
      if (isEasy) easyCorrect++;
    } else {
      incorrectQuestions.push(q.question);
    }
    if (isHard) hardTotal++;
    if (isEasy) easyTotal++;
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const accuracy = questions.length > 0 ? correctQuestions.length / questions.length : 0;

  const recommendations: string[] = [];
  if (score >= 95) {
    recommendations.push("Outstanding mastery demonstrated. You're ready for expert-level challenges.");
    recommendations.push("Consider mentoring others or contributing to open-source projects in this domain.");
  } else if (score >= 85) {
    recommendations.push("Strong performance showing deep understanding of core concepts.");
    if (incorrectQuestions.length > 0) {
      recommendations.push(`Review these specific topics: ${incorrectQuestions.slice(0, 2).join("; ")}.`);
    }
    recommendations.push("Try advanced-level assessments to further validate your expertise.");
  } else if (score >= 70) {
    recommendations.push("Good foundational knowledge with room for targeted improvement.");
    if (hardTotal > 0 && hardCorrect < hardTotal) {
      recommendations.push("Focus on advanced concepts — you missed some higher-difficulty questions.");
    }
    recommendations.push("Practice with real-world projects to solidify your understanding.");
  } else if (score >= 50) {
    recommendations.push("You have a basic understanding but need to strengthen core concepts.");
    if (easyTotal > 0 && easyCorrect < easyTotal) {
      recommendations.push("Start by reviewing fundamental concepts before moving to advanced topics.");
    }
    recommendations.push("Consider structured learning resources like courses or documentation deep-dives.");
  } else {
    recommendations.push("Significant knowledge gaps identified. Start with beginner-level learning materials.");
    recommendations.push("Focus on understanding core principles before attempting assessments again.");
    recommendations.push("Hands-on tutorials and guided projects will help build practical understanding.");
  }

  const confidenceScore = Math.round(
    Math.min(
      accuracy * 60 +
      (easyTotal > 0 ? (easyCorrect / easyTotal) * 20 : 10) +
      (hardTotal > 0 ? (hardCorrect / hardTotal) * 20 : 10),
      100
    )
  );

  return {
    score,
    passed: score >= 70,
    analysis: {
      strengthAreas: correctQuestions.slice(0, 3),
      weaknessAreas: incorrectQuestions.slice(0, 3),
      recommendations,
      confidenceScore,
      detailedBreakdown: {
        correctAnswers: correctQuestions.length,
        totalQuestions: questions.length,
        scorePercentage: score,
        easyAccuracy: easyTotal > 0 ? Math.round((easyCorrect / easyTotal) * 100) : 0,
        hardAccuracy: hardTotal > 0 ? Math.round((hardCorrect / hardTotal) * 100) : 0,
      },
    },
  };
}
