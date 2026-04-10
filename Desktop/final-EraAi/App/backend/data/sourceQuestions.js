// Source questions styled like GeeksforGeeks and Sanfoundry
// Used as style examples for Gemini AI to generate similar questions

module.exports = {
  'DSA': [
    {
      question: "What is the output of the following code?\nint arr[] = {1, 2, 3, 4, 5};\nprintf(\"%d\", arr[4]);",
      options: ["4", "5", "Garbage value", "Compilation error"],
      correct: 1,
      topic: "Arrays",
      difficulty: 2
    },
    {
      question: "Which of the following is NOT a stable sorting algorithm?",
      options: ["Merge Sort", "Bubble Sort", "Quick Sort", "Insertion Sort"],
      correct: 2,
      topic: "Sorting",
      difficulty: 4
    },
    {
      question: "What is the worst-case time complexity of QuickSort?",
      options: ["O(n log n)", "O(n)", "O(n²)", "O(log n)"],
      correct: 2,
      topic: "Sorting",
      difficulty: 3
    },
    {
      question: "In a singly linked list, what is the time complexity of deleting a node given only a pointer to that node (not head)?",
      options: ["O(1)", "O(n)", "O(log n)", "Cannot be done"],
      correct: 0,
      topic: "Linked List",
      difficulty: 6
    },
    {
      question: "Which traversal of a Binary Search Tree gives nodes in sorted (ascending) order?",
      options: ["Pre-order", "Post-order", "In-order", "Level-order"],
      correct: 2,
      topic: "Trees",
      difficulty: 3
    },
    {
      question: "What is the minimum number of edges in a connected graph with n vertices?",
      options: ["n", "n - 1", "n + 1", "n²"],
      correct: 1,
      topic: "Graphs",
      difficulty: 4
    },
    {
      question: "Which data structure is used internally by recursion?",
      options: ["Queue", "Array", "Stack", "Linked List"],
      correct: 2,
      topic: "Stack",
      difficulty: 2
    },
    {
      question: "What is the time complexity of searching an element in a balanced BST?",
      options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"],
      correct: 1,
      topic: "Trees",
      difficulty: 3
    },
    {
      question: "What does the following recurrence represent: T(n) = 2T(n/2) + O(n)?",
      options: ["Binary Search", "Linear Search", "Merge Sort", "Insertion Sort"],
      correct: 2,
      topic: "Divide and Conquer",
      difficulty: 5
    },
    {
      question: "In a max-heap with n elements, where is the minimum element always located?",
      options: ["Root", "One of the leaf nodes", "Second level", "Cannot be determined without full traversal"],
      correct: 1,
      topic: "Heap",
      difficulty: 5
    },
    {
      question: "What is the space complexity of Merge Sort?",
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      correct: 2,
      topic: "Sorting",
      difficulty: 4
    },
    {
      question: "Dijkstra's algorithm fails when the graph has:",
      options: ["Cycles", "Negative weight edges", "Disconnected components", "More than 1000 nodes"],
      correct: 1,
      topic: "Graphs",
      difficulty: 5
    },
    {
      question: "What is the amortized time complexity of push and pop in a dynamic array?",
      options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
      correct: 2,
      topic: "Arrays",
      difficulty: 6
    },
    {
      question: "Which of the following problems is solved using dynamic programming?",
      options: ["Tower of Hanoi", "0/1 Knapsack", "Finding max in array", "Binary Search"],
      correct: 1,
      topic: "Dynamic Programming",
      difficulty: 4
    },
    {
      question: "What is the output?\nint i = 0;\nwhile(i < 3) { printf(\"%d \", i); i++; }",
      options: ["0 1 2 3", "0 1 2", "1 2 3", "Infinite loop"],
      correct: 1,
      topic: "Arrays",
      difficulty: 2
    }
  ],

  'AI/ML': [
    {
      question: "Which activation function suffers from the 'dying ReLU' problem?",
      options: ["Sigmoid", "Tanh", "ReLU", "Softmax"],
      correct: 2,
      topic: "Neural Networks",
      difficulty: 5
    },
    {
      question: "In logistic regression, what is the range of the output?",
      options: ["(-inf, +inf)", "[0, 1]", "[-1, 1]", "[0, inf)"],
      correct: 1,
      topic: "Classification",
      difficulty: 3
    },
    {
      question: "Which metric is most appropriate when the dataset is highly imbalanced?",
      options: ["Accuracy", "F1 Score", "Mean Squared Error", "R-squared"],
      correct: 1,
      topic: "Model Evaluation",
      difficulty: 5
    },
    {
      question: "What does dropout regularization do during training?",
      options: ["Removes low-variance features", "Randomly sets a fraction of neurons to zero to prevent overfitting", "Reduces the learning rate", "Adds noise to input data"],
      correct: 1,
      topic: "Regularization",
      difficulty: 5
    },
    {
      question: "Which of the following is an unsupervised learning algorithm?",
      options: ["Linear Regression", "Decision Tree", "K-Means Clustering", "SVM"],
      correct: 2,
      topic: "Clustering",
      difficulty: 3
    },
    {
      question: "Precision in binary classification is defined as:",
      options: ["TP / (TP + FN)", "TP / (TP + FP)", "TN / (TN + FP)", "TP / (TP + TN)"],
      correct: 1,
      topic: "Model Evaluation",
      difficulty: 4
    },
    {
      question: "What is the role of the learning rate in gradient descent?",
      options: ["Controls number of epochs", "Controls step size during weight updates", "Controls batch size", "Controls model depth"],
      correct: 1,
      topic: "Training",
      difficulty: 3
    },
    {
      question: "What is the vanishing gradient problem?",
      options: ["GPU memory overflow", "Gradients shrink exponentially during backprop, making early layers learn very slowly", "Loss function reaching zero too fast", "Model predictions becoming overconfident"],
      correct: 1,
      topic: "Deep Learning",
      difficulty: 6
    },
    {
      question: "What does PCA (Principal Component Analysis) do?",
      options: ["Classifies data into categories", "Reduces dimensionality by projecting onto principal components", "Clusters similar data points", "Generates synthetic data"],
      correct: 1,
      topic: "Dimensionality Reduction",
      difficulty: 5
    },
    {
      question: "Which algorithm builds a Random Forest?",
      options: ["Gradient Descent", "Bagging with Decision Trees", "Boosting with SVMs", "K-Means Clustering"],
      correct: 1,
      topic: "Ensemble Methods",
      difficulty: 5
    },
    {
      question: "In k-fold cross validation with k=5 and 1000 samples, how many samples are in each validation fold?",
      options: ["100", "200", "500", "50"],
      correct: 1,
      topic: "Model Evaluation",
      difficulty: 4
    },
    {
      question: "Which of the following is NOT a feature selection technique?",
      options: ["Recursive Feature Elimination", "Principal Component Analysis", "LASSO regularization", "Gradient Boosting prediction"],
      correct: 3,
      topic: "Feature Engineering",
      difficulty: 5
    },
    {
      question: "A False Negative in a confusion matrix means:",
      options: ["Predicted positive, actually positive", "Predicted negative, actually positive", "Predicted positive, actually negative", "Predicted negative, actually negative"],
      correct: 1,
      topic: "Model Evaluation",
      difficulty: 4
    },
    {
      question: "What is the purpose of a validation set?",
      options: ["To train the model", "To tune hyperparameters and prevent overfitting to test data", "To measure final performance", "To increase training data size"],
      correct: 1,
      topic: "Training",
      difficulty: 4
    },
    {
      question: "Which of the following is a hyperparameter in k-Nearest Neighbors?",
      options: ["The weights assigned to neighbors", "The value of k", "The output distance metric", "The class probabilities"],
      correct: 1,
      topic: "KNN",
      difficulty: 3
    }
  ],

  'Web Dev': [
    {
      question: "What is the output of the following JavaScript?\nconsole.log(typeof null);",
      options: ["'null'", "'undefined'", "'object'", "'string'"],
      correct: 2,
      topic: "JavaScript",
      difficulty: 4
    },
    {
      question: "What does the following JavaScript output?\nconsole.log(1 + '2' + 3);",
      options: ["6", "'123'", "123", "NaN"],
      correct: 1,
      topic: "JavaScript",
      difficulty: 3
    },
    {
      question: "Which HTTP method is idempotent but NOT safe?",
      options: ["GET", "POST", "PUT", "DELETE"],
      correct: 2,
      topic: "HTTP",
      difficulty: 5
    },
    {
      question: "In React, when does useEffect with an empty dependency array [] run?",
      options: ["On every render", "Only when a state changes", "Only once after the initial render", "Never"],
      correct: 2,
      topic: "React",
      difficulty: 4
    },
    {
      question: "What is the purpose of the 'key' prop when rendering lists in React?",
      options: ["Styling list items", "Helping React identify which items changed for efficient re-rendering", "Making items draggable", "Setting item order"],
      correct: 1,
      topic: "React",
      difficulty: 4
    },
    {
      question: "What is the difference between == and === in JavaScript?",
      options: ["No difference", "== checks value only (type coercion), === checks value and type", "=== is faster", "== only works with numbers"],
      correct: 1,
      topic: "JavaScript",
      difficulty: 3
    },
    {
      question: "What does CORS stand for?",
      options: ["Cross-Origin Resource Sharing", "Content Origin Response System", "Client-Object Routing Service", "Cross-Object Rendering Standard"],
      correct: 0,
      topic: "Security",
      difficulty: 3
    },
    {
      question: "What does the following output?\nconst x = [1, 2, 3];\nconsole.log(x.map(n => n * 2));",
      options: ["[1, 2, 3]", "[2, 4, 6]", "undefined", "Error"],
      correct: 1,
      topic: "JavaScript",
      difficulty: 3
    },
    {
      question: "What is a JWT primarily used for?",
      options: ["Database queries", "Stateless authentication and authorization", "HTML rendering", "CSS animations"],
      correct: 1,
      topic: "Authentication",
      difficulty: 4
    },
    {
      question: "What is event bubbling in the DOM?",
      options: ["CSS animation effect", "When an event on a child propagates upward to parent elements", "JavaScript error propagation", "A Node.js event pattern"],
      correct: 1,
      topic: "JavaScript",
      difficulty: 4
    },
    {
      question: "What is the difference between localStorage and sessionStorage?",
      options: ["No difference", "localStorage persists until cleared; sessionStorage clears when tab closes", "sessionStorage has more space", "localStorage only stores numbers"],
      correct: 1,
      topic: "Browser APIs",
      difficulty: 4
    },
    {
      question: "What does async/await do in JavaScript?",
      options: ["Runs code in parallel threads", "Syntactic sugar over Promises making async code look synchronous", "Creates web workers", "Reduces memory usage"],
      correct: 1,
      topic: "JavaScript",
      difficulty: 4
    },
    {
      question: "Which Node.js module is used to create an HTTP server?",
      options: ["fs", "path", "http", "os"],
      correct: 2,
      topic: "Node.js",
      difficulty: 2
    },
    {
      question: "Which of the following prevents SQL injection in a Node.js/MongoDB app?",
      options: ["Using string concatenation for queries", "Mongoose schema validation and parameterized queries", "Disabling database firewall", "Using GET instead of POST"],
      correct: 1,
      topic: "Security",
      difficulty: 5
    },
    {
      question: "Which CSS property creates a flexible layout container?",
      options: ["display: block", "display: flex", "position: relative", "float: left"],
      correct: 1,
      topic: "CSS",
      difficulty: 2
    }
  ],

  'CS Fundamentals': [
    // ── Operating Systems ──
    {
      question: "Which page replacement algorithm suffers from Belady's anomaly?",
      options: ["LRU", "Optimal", "FIFO", "LFU"],
      correct: 2,
      topic: "Operating Systems",
      difficulty: 6
    },
    {
      question: "What is thrashing in operating systems?",
      options: ["Hard drive failure", "A process spends more time swapping pages than executing", "CPU overheating", "A type of memory leak"],
      correct: 1,
      topic: "Operating Systems",
      difficulty: 6
    },
    {
      question: "What is the key difference between a process and a thread?",
      options: ["No difference", "A process has its own memory space; threads within a process share memory", "Threads are always slower", "Processes share memory space"],
      correct: 1,
      topic: "Operating Systems",
      difficulty: 4
    },
    {
      question: "Which scheduling algorithm can cause starvation?",
      options: ["Round Robin", "FCFS", "Priority Scheduling", "Shortest Job First (non-preemptive)"],
      correct: 2,
      topic: "Operating Systems",
      difficulty: 5
    },
    {
      question: "What is the difference between paging and segmentation?",
      options: ["No difference", "Paging uses fixed-size frames; segmentation uses variable-size logical units", "Segmentation is always faster", "Paging requires more RAM"],
      correct: 1,
      topic: "Operating Systems",
      difficulty: 6
    },
    // ── DBMS ──
    {
      question: "Which normal form eliminates transitive dependencies?",
      options: ["1NF", "2NF", "3NF", "BCNF"],
      correct: 2,
      topic: "DBMS",
      difficulty: 5
    },
    {
      question: "What is the purpose of indexing in a database?",
      options: ["Encrypting data", "Speeding up retrieval by creating a sorted reference structure", "Backing up data", "Normalizing tables"],
      correct: 1,
      topic: "DBMS",
      difficulty: 4
    },
    {
      question: "What does SELECT COUNT(*) return if no rows match the WHERE condition?",
      options: ["NULL", "0", "Error", "-1"],
      correct: 1,
      topic: "DBMS",
      difficulty: 4
    },
    {
      question: "A foreign key in a relational database is:",
      options: ["An encrypted primary key", "A key imported from another country", "A column referencing the primary key of another table", "A key with no duplicates allowed"],
      correct: 2,
      topic: "DBMS",
      difficulty: 3
    },
    {
      question: "What does ACID stand for in database transactions?",
      options: ["Access, Control, Integrity, Durability", "Atomicity, Consistency, Isolation, Durability", "Atomicity, Concurrency, Integrity, Distribution", "Access, Consistency, Indexing, Durability"],
      correct: 1,
      topic: "DBMS",
      difficulty: 4
    },
    // ── Computer Networks ──
    {
      question: "In TCP, what does the SYN flag indicate?",
      options: ["Synchronize — initiates a connection", "Sends data payload", "Acknowledges receipt", "Terminates a connection"],
      correct: 0,
      topic: "Computer Networks",
      difficulty: 4
    },
    {
      question: "In IPv4, how many bits are in an IP address?",
      options: ["16", "64", "32", "128"],
      correct: 2,
      topic: "Computer Networks",
      difficulty: 2
    },
    {
      question: "At which OSI layer does a router operate?",
      options: ["Data Link Layer (Layer 2)", "Physical Layer (Layer 1)", "Network Layer (Layer 3)", "Transport Layer (Layer 4)"],
      correct: 2,
      topic: "Computer Networks",
      difficulty: 4
    },
    {
      question: "What does DNS do?",
      options: ["Encrypts web traffic", "Translates domain names to IP addresses", "Manages email routing", "Assigns MAC addresses"],
      correct: 1,
      topic: "Computer Networks",
      difficulty: 3
    },
    {
      question: "What is the difference between TCP and UDP?",
      options: ["No difference", "TCP is connection-oriented and reliable; UDP is connectionless and faster but unreliable", "UDP guarantees delivery", "TCP is used only for video streaming"],
      correct: 1,
      topic: "Computer Networks",
      difficulty: 4
    },
    // ── Linux ──
    {
      question: "Which Linux command shows the current directory's absolute path?",
      options: ["ls", "cd", "pwd", "dir"],
      correct: 2,
      topic: "Linux",
      difficulty: 2
    },
    {
      question: "What does 'chmod 755 file.sh' do in Linux?",
      options: ["Deletes the file", "Gives owner read/write/execute; group and others read/execute", "Makes the file read-only for everyone", "Changes file ownership"],
      correct: 1,
      topic: "Linux",
      difficulty: 4
    },
    {
      question: "Which command in Linux is used to view running processes?",
      options: ["ls -la", "ps aux", "top -k", "jobs"],
      correct: 1,
      topic: "Linux",
      difficulty: 3
    },
    {
      question: "What does the pipe operator '|' do in Linux?",
      options: ["Redirects output to a file", "Passes output of one command as input to another", "Runs two commands simultaneously", "Terminates a process"],
      correct: 1,
      topic: "Linux",
      difficulty: 3
    },
    {
      question: "Which command is used to search for a pattern in files in Linux?",
      options: ["find", "locate", "grep", "awk"],
      correct: 2,
      topic: "Linux",
      difficulty: 3
    }
  ]
};
