/**
 * OmniForge Dedicated Machine Learning & AI Curriculum Architect
 *
 * 12 Progressive Stages:
 * 1. Vectorized Computing & Linear Algebra Foundations with NumPy
 * 2. Exploratory Data Analysis & Inferential Statistics with Pandas
 * 3. Feature Engineering, Data Cleaning & Preprocessing Pipelines
 * 4. Classical Supervised Learning: Regression & Classification (Scikit-Learn)
 * 5. Tree Ensembles: Random Forests, Gradient Boosting (XGBoost, LightGBM)
 * 6. Unsupervised Learning & Dimensionality Reduction (K-Means, PCA)
 * 7. Model Evaluation Metrics, Hyperparameter Tuning & Cross-Validation
 * 8. Deep Learning Foundations with PyTorch (Tensors, Autograd, Modules)
 * 9. Computer Vision & Sequential Architectures (CNNs & LSTMs)
 * 10. Transformer Architectures, Self-Attention & Hugging Face
 * 11. Large Language Models, Vector Embeddings & RAG Systems
 * 12. Production MLOps, Model Serving & Deployment Capstone
 */

import { DeepTopicItem } from "../user-intelligence";
import { BlueprintStageDefinition, StageContentDetail } from "./types";

export const ML_BLUEPRINT_STAGES: BlueprintStageDefinition[] = [
  {
    stage: 1,
    title: "Vectorized Computing & Linear Algebra Foundations with NumPy",
    skillFocus: "N-Dimensional Arrays, Matrix Math & Vectorized Operations",
    objective: "Master NumPy ndarray memory layouts, broadcasting rules, dot products, matrix decompositions, and high-performance vectorization.",
    prerequisites: ["Python fundamentals (variables, functions, loops)"],
    prerequisiteChecks: ["Comfortable writing basic Python scripts and running terminal commands"],
    keyCompetencies: ["NumPy broadcasting arithmetic", "Matrix multiplication (@ vs .dot)", "Vectorized masking and filtering", "Strided memory layouts"],
    projectTitle: "Vectorized Linear Algebra Engine & Benchmark Lab",
    deliverables: ["matrix_engine.py implementing custom vector distance metrics", "vectorization_benchmark.py showing 100x speedup over Python loops"],
    definitionOfDone: ["Replaces all nested for-loops with pure vectorized NumPy operations", "Calculations handle arbitrary tensor batch shapes cleanly"],
    estimatedStudyHours: 14,
    recommendedPacing: "1 week at 2 hours/day",
  },
  {
    stage: 2,
    title: "Exploratory Data Analysis & Inferential Statistics with Pandas",
    skillFocus: "DataFrames, Missing Value Profiling, Distributions & Statistical Testing",
    objective: "Analyze and clean structured tabular data using Pandas DataFrames, hypothesis testing, correlation matrices, and distribution analysis.",
    prerequisites: ["Stage 1: Vectorized Computing with NumPy"],
    prerequisiteChecks: ["Familiarity with array indexing and boolean slicing"],
    keyCompetencies: ["DataFrame slicing (.loc, .iloc)", "GroupBy aggregation pipelines", "P-values, confidence intervals & t-tests", "Correlation analysis (Pearson / Spearman)"],
    projectTitle: "Statistical EDA & Diagnostic Dataset Audit Report",
    deliverables: ["eda_pipeline.py with statistical summary outputs", "Cleaned dataset CSV with imputed values and outlier documentation"],
    definitionOfDone: ["Pipeline flags multicollinearity (VIF > 5) and skewness", "Generates comprehensive distribution profiling tables without data truncation"],
    estimatedStudyHours: 16,
    recommendedPacing: "1 week at 2.5 hours/day",
  },
  {
    stage: 3,
    title: "Feature Engineering, Data Cleaning & Preprocessing Pipelines",
    skillFocus: "Data Leakage Prevention, Feature Transformation & Scikit-Learn Pipelines",
    objective: "Build production-ready data transformation pipelines without data leakage using ColumnTransformer, RobustScaler, and OneHotEncoder.",
    prerequisites: ["Stage 2: Exploratory Data Analysis"],
    prerequisiteChecks: ["Understanding of missing values, categorical vs numerical variables"],
    keyCompetencies: ["Data leakage prevention between train and test splits", "Scikit-Learn Pipeline and ColumnTransformer", "Target encoding and interaction features", "Handling high-cardinality categories"],
    projectTitle: "Production Preprocessing Pipeline with Schema Validation",
    deliverables: ["preprocess_pipeline.py utilizing Scikit-Learn Pipelines", "Serialized pipeline artifact (pipeline.joblib) ready for inference"],
    definitionOfDone: ["Pipeline fits strictly on training splits and transforms test splits", "Zero data leakage verified across cross-validation splits"],
    estimatedStudyHours: 16,
    recommendedPacing: "1 week at 2.5 hours/day",
  },
  {
    stage: 4,
    title: "Classical Supervised Learning: Regression & Classification",
    skillFocus: "Linear Regression, Regularization (Ridge/Lasso), Logistic Regression & SVMs",
    objective: "Train, evaluate, and interpret foundational linear and non-linear supervised models with regularization to prevent overfitting.",
    prerequisites: ["Stage 3: Feature Engineering"],
    prerequisiteChecks: ["Solid understanding of feature matrices X and target vector y"],
    keyCompetencies: ["Cost function minimization via gradient descent", "L1 (Lasso) vs L2 (Ridge) regularization penalties", "Logistic regression odds ratios and decision boundaries", "Support Vector Machines and kernel tricks"],
    projectTitle: "Predictive Real Estate Valuation & Credit Risk Classifier",
    deliverables: ["regression_model.py with Ridge regularization", "classifier_model.py with probability calibration", "Model coefficients interpretability report"],
    definitionOfDone: ["Models demonstrate superior generalization on held-out test data vs baseline dummy models", "Regularization hyperparameters tuned using cross-validation"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 5,
    title: "Tree Ensembles: Random Forests, Gradient Boosting (XGBoost, LightGBM)",
    skillFocus: "Decision Trees, Bagging, Boosting & Feature Importance Analysis",
    objective: "Master ensemble methods, bagging with Random Forests, boosting algorithms (XGBoost, LightGBM, CatBoost), and SHAP tree interpretability.",
    prerequisites: ["Stage 4: Supervised Learning"],
    prerequisiteChecks: ["Familiarity with classification and regression loss functions"],
    keyCompetencies: ["Information gain, entropy, and Gini impurity", "Random Forest bagging and out-of-bag (OOB) error", "Gradient boosting residual fitting", "Early stopping and learning rate regularization"],
    projectTitle: "Production Customer Churn Predictor with XGBoost & SHAP",
    deliverables: ["train_xgboost.py with early stopping callbacks", "shap_explainability.py generating global and local feature importance plots"],
    definitionOfDone: ["XGBoost model outperforms baseline linear models by >= 5% ROC-AUC", "SHAP summary confirms top contributing predictive features"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 6,
    title: "Unsupervised Learning & Dimensionality Reduction",
    skillFocus: "Clustering Algorithms, PCA, t-SNE & Anomaly Detection",
    objective: "Discover latent patterns, cluster high-dimensional data, reduce dimensionality with PCA, and detect outliers using Isolation Forests.",
    prerequisites: ["Stage 1: Linear Algebra and Stage 2: EDA"],
    prerequisiteChecks: ["Matrix transformations and variance understanding"],
    keyCompetencies: ["K-Means clustering and Elbow / Silhouette optimization", "DBSCAN density-based clustering", "Principal Component Analysis (PCA) explained variance ratio", "Isolation Forest anomaly detection"],
    projectTitle: "Market Basket Customer Segmentation & Fraud Detection Engine",
    deliverables: ["customer_segmentation.py with optimal cluster selection", "anomaly_detector.py flagging fraudulent transactional outliers"],
    definitionOfDone: ["PCA reduces feature space while retaining >= 90% explained variance", "Silhouette scores confirm well-separated, meaningful customer clusters"],
    estimatedStudyHours: 16,
    recommendedPacing: "1 week at 2.5 hours/day",
  },
  {
    stage: 7,
    title: "Model Evaluation Metrics, Hyperparameter Tuning & Cross-Validation",
    skillFocus: "Imbalanced Classification, Precision-Recall Curves, Bayesian Optimization",
    objective: "Evaluate models rigorously under severe class imbalance using PR curves, F1-scores, stratified cross-validation, and Optuna tuning.",
    prerequisites: ["Stage 4 and Stage 5: Supervised Models"],
    prerequisiteChecks: ["Knowledge of train/test splits and model fitting"],
    keyCompetencies: ["Precision, Recall, F1, and PR-AUC trade-offs", "Stratified K-Fold and GroupKFold cross-validation", "Bayesian hyperparameter optimization with Optuna", "Probability threshold tuning for business utility"],
    projectTitle: "Optuna Automated Hyperparameter Tuning & Evaluation Suite",
    deliverables: ["optuna_study.py automating Bayesian search over 100 trials", "evaluation_report.py generating PR curves and confusion matrices"],
    definitionOfDone: ["Hyperparameter search improves validation metric without overfitting training data", "Model threshold chosen based on defined business cost-matrix trade-offs"],
    estimatedStudyHours: 18,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 8,
    title: "Deep Learning Foundations with PyTorch (Tensors, Autograd, Modules)",
    skillFocus: "PyTorch Tensor Operations, Computational Graphs, Backprop & Custom Modules",
    objective: "Build deep neural networks from scratch using PyTorch, custom torch.nn.Module classes, automatic differentiation (autograd), and DataLoader pipelines.",
    prerequisites: ["Stage 1: NumPy and Stage 4: Supervised Learning"],
    prerequisiteChecks: ["Comfortable with matrix operations, derivatives, and gradient descent"],
    keyCompetencies: ["PyTorch Tensors, device placement (CPU vs GPU / MPS)", "Autograd dynamic computational graphs and backward()", "torch.nn.Module, Linear layers, activations (ReLU, GELU)", "Dataset, DataLoader, and batch optimization loop"],
    projectTitle: "Multi-Layer Perceptron (MLP) Classifier Built from Scratch in PyTorch",
    deliverables: ["model.py defining custom PyTorch architecture", "train.py with training loop, validation loss tracking, and checkpoint saving"],
    definitionOfDone: ["Training loop logs loss curves and validates on separate validation set every epoch", "Weights saved and reloaded using torch.save and torch.load state_dict"],
    estimatedStudyHours: 20,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 9,
    title: "Computer Vision & Sequential Architectures (CNNs & LSTMs)",
    skillFocus: "Convolutional Kernels, Pooling, Transfer Learning & Sequential Recurrence",
    objective: "Implement Convolutional Neural Networks (CNNs) for image classification and Recurrent Neural Networks (LSTMs) for sequential time-series modeling.",
    prerequisites: ["Stage 8: PyTorch Foundations"],
    prerequisiteChecks: ["Familiarity with PyTorch training loops and loss optimization"],
    keyCompetencies: ["Convolutional layers (Conv2d), stride, padding, and pooling", "Transfer learning with pretrained ResNet / ConvNeXt backbones", "Recurrent layers (LSTM, GRU) for temporal dependencies", "Data augmentation pipelines with torchvision"],
    projectTitle: "Transfer Learning Image Classifier & Time-Series Forecaster",
    deliverables: ["image_classifier.py fine-tuning pretrained ResNet", "time_series_lstm.py forecasting multi-step temporal trends"],
    definitionOfDone: ["Transfer learning model achieves >= 90% top-1 accuracy on target dataset", "Zero overfitting confirmed through validation loss stabilization"],
    estimatedStudyHours: 20,
    recommendedPacing: "1.5 weeks at 2 hours/day",
  },
  {
    stage: 10,
    title: "Transformer Architectures, Self-Attention & Hugging Face",
    skillFocus: "Scaled Dot-Product Attention, Multi-Head Attention & Hugging Face Transformers",
    objective: "Understand self-attention mechanisms, position encodings, Transformer encoders/decoders, and fine-tune models using the Hugging Face ecosystem.",
    prerequisites: ["Stage 8: PyTorch and Stage 9: Neural Architectures"],
    prerequisiteChecks: ["Experience training neural networks in PyTorch"],
    keyCompetencies: ["Scaled Dot-Product Attention: Q, K, V matrix math", "Multi-Head Attention and positional encodings", "Hugging Face transformers: AutoModel, AutoTokenizer", "Parameter-Efficient Fine-Tuning (LoRA / QLoRA with PEFT)"],
    projectTitle: "Domain-Specific Text Classifier Fine-Tuned with LoRA",
    deliverables: ["finetune_lora.py fine-tuning RoBERTa / Mistral with PEFT", "inference_pipeline.py generating predictions with sub-50ms latency"],
    definitionOfDone: ["Fine-tuning runs within GPU memory constraints using LoRA rank decomposition", "Fine-tuned model achieves state-of-the-art accuracy on domain dataset"],
    estimatedStudyHours: 22,
    recommendedPacing: "2 weeks at 2 hours/day",
  },
  {
    stage: 11,
    title: "Large Language Models, Vector Embeddings & RAG Systems",
    skillFocus: "Dense Embeddings, Vector Databases, Chunking & Retrieval-Augmented Generation",
    objective: "Architect production Retrieval-Augmented Generation (RAG) pipelines using semantic vector embeddings, vector databases (Qdrant/Chroma), and re-ranking.",
    prerequisites: ["Stage 10: Transformers and Stage 7: Evaluation"],
    prerequisiteChecks: ["Familiarity with modern LLMs and API integrations"],
    keyCompetencies: ["Dense semantic vector embeddings (sentence-transformers)", "Document chunking strategies (semantic, recursive)", "Vector similarity search (HNSW, Cosine similarity)", "Context re-ranking and hallucination prevention"],
    projectTitle: "Production Enterprise Knowledge Retrieval (RAG) Assistant",
    deliverables: ["ingest_pipeline.py chunking documents and generating vector index", "rag_engine.py executing semantic retrieval with answer synthesis"],
    definitionOfDone: ["RAG pipeline provides grounded citations for 100% of generated responses", "Evaluation framework measures retrieval precision and answer faithfulness"],
    estimatedStudyHours: 22,
    recommendedPacing: "2 weeks at 2 hours/day",
  },
  {
    stage: 12,
    title: "Production MLOps, Model Serving & Deployment Capstone",
    skillFocus: "ONNX Runtime, FastAPI Inference Server, Dockerization & Drift Monitoring",
    objective: "Export models to optimized formats (ONNX), deploy containerized FastAPI model servers, and monitor data drift and inference latency in production.",
    prerequisites: ["Stages 1 through 11"],
    prerequisiteChecks: ["Working trained models and experience with Python APIs"],
    keyCompetencies: ["ONNX model quantization and export", "FastAPI low-latency inference endpoint", "Multi-stage Docker containerization for ML", "Data and concept drift detection (Evidently AI / Prometheus)"],
    projectTitle: "OmniForge AI Inference Microservice with Monitoring Capstone",
    deliverables: ["Full production model repository with ONNX runtime", "Dockerfile packaging model and serving dependencies", "CI/CD pipeline deploying service to cloud with latency telemetry"],
    definitionOfDone: ["Inference endpoint serves predictions in under 30ms p95 latency", "Service includes automated health checks and data drift detection alerts"],
    estimatedStudyHours: 26,
    recommendedPacing: "2 weeks at 2 hours/day",
  },
];

export function getMLDeepStageContent(stageNum: number): StageContentDetail {
  const stage = ML_BLUEPRINT_STAGES.find((s) => s.stage === stageNum) || ML_BLUEPRINT_STAGES[0];
  const title = stage.title;

  return {
    topics: [
      {
        id: `ml_${stageNum}_1`,
        title: `${title}: Mathematical Foundations & Algorithmic Mechanics`,
        completed: false,
        subtopics: [
          `Mathematical foundations, loss formulation, and optimization dynamics of ${title}`,
          `Vectorized computation, tensor shape invariants, and memory layout efficiency`,
          `Edge cases: numerical overflow/underflow, vanishing gradients, and NaN prevention`,
          `Computational complexity (time and space Big-O) across training vs inference passes`,
          `Integration with standard scientific libraries (NumPy, SciPy, PyTorch, Scikit-Learn)`,
        ],
        explanation:
          `Stage ${stageNum} focuses on ${title}. In machine learning and artificial intelligence, building robust systems requires moving beyond treating algorithms as black boxes. Understanding the mathematical loss functions, matrix operations, gradient updates, and tensor dimensionalities allows practitioners to diagnose underfitting, eliminate numerical instability, and optimize model throughput.`,
        keySyntaxOrApis: [
          `# Core scientific Python syntax for Stage ${stageNum}: ${title}`,
          `import numpy as np`,
          `import torch`,
          `# Tensor shape invariant: [batch_size, sequence_length, embedding_dim]`,
        ],
        example: {
          title: `${title} Mathematical & Vectorized Implementation`,
          description: `Complete, runnable Python snippet demonstrating the mathematical mechanics of Stage ${stageNum}.`,
          codeOrWalkthrough:
            `import numpy as np\n\ndef compute_stage_${stageNum}_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:\n    """Computes foundational evaluation metrics using vectorized NumPy operations."""\n    errors = y_true - y_pred\n    mse = float(np.mean(errors ** 2))\n    rmse = float(np.sqrt(mse))\n    mae = float(np.mean(np.abs(errors)))\n    return {"mse": mse, "rmse": rmse, "mae": mae}\n\nif __name__ == "__main__":\n    true_vals = np.array([1.0, 2.0, 3.5, 4.0])\n    pred_vals = np.array([1.1, 1.9, 3.4, 4.2])\n    res = compute_stage_${stageNum}_metrics(true_vals, pred_vals)\n    print("Calculated metrics:", res)`,
        },
        exercise: {
          title: `${title} Algorithmic Implementation Lab`,
          prompt: `Implement a modular, vectorized function computing the core mathematical operations of Stage ${stageNum} without using iterative Python loops.`,
          expectedOutcome: `Function processes 10,000 samples in under 20 milliseconds with numerical stability.`,
          starterCode: `import numpy as np\n\ndef run_ml_lab(data: np.ndarray) -> np.ndarray:\n    # Implement vectorized transformation\n    return data - np.mean(data, axis=0)\n\nprint("Lab module ready.")`,
        },
        troubleshooting: [
          `Always check tensor shapes with .shape and verify broadcast compatibility before arithmetic.`,
          `Add numerical epsilon guards (e.g. 1e-8) inside logarithms and denominators to prevent division by zero or NaN values.`,
        ],
      },
      {
        id: `ml_${stageNum}_2`,
        title: `${title}: Data Pipeline Architecture & Leakage Prevention`,
        completed: false,
        subtopics: [
          `Data preparation, batch loading, and feature transformation pipelines`,
          `Preventing data leakage between training, validation, and testing distributions`,
          `Handling class imbalance, missing values, and high-dimensional sparse representations`,
          `Memory-efficient streaming pipelines for datasets exceeding physical RAM`,
          `Serialization and artifact versioning for reproducible experiments`,
        ],
        explanation:
          `Data engineering and preprocessing determine the upper bound of model performance. Fitting scalers, encoders, or imputation models on the entire dataset before splitting introduces subtle data leakage that inflates validation metrics while causing catastrophic degradation in production. Structuring immutable preprocessing pipelines ensures experimental integrity.`,
        keySyntaxOrApis: [
          `from sklearn.pipeline import Pipeline`,
          `from sklearn.preprocessing import StandardScaler`,
          `# pipeline.fit(X_train) -> pipeline.transform(X_test)`,
        ],
        example: {
          title: `${title} Leakage-Free Preprocessing Pipeline`,
          description: `Demonstrating proper train-test split isolation and Scikit-Learn Pipeline encapsulation.`,
          codeOrWalkthrough:
            `import numpy as np\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.preprocessing import StandardScaler\n\ndef run_pipeline_demo() -> None:\n    X = np.random.randn(100, 5)\n    y = (X[:, 0] > 0).astype(int)\n    \n    # Strictly split before fitting any preprocessing transform\n    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)\n    \n    scaler = StandardScaler()\n    X_train_scaled = scaler.fit_transform(X_train)\n    X_test_scaled = scaler.transform(X_test)  # Transform ONLY on test set\n    \n    print(f"X_train mean: {X_train_scaled.mean(axis=0).round(2)}")\n    print(f"X_test shape: {X_test_scaled.shape}")\n\nif __name__ == "__main__":\n    run_pipeline_demo()`,
        },
        exercise: {
          title: `${title} Preprocessing & Validation Split Lab`,
          prompt: `Build an automated pipeline that ingests raw tabular data, cleans anomalies, transforms features without leakage, and asserts that test data was never fitted.`,
          expectedOutcome: `Pipeline transforms test data using strictly training-derived statistics with 0 data leakage.`,
        },
        troubleshooting: [
          `Never call fit() or fit_transform() on validation or test datasets.`,
          `Use StratifiedKFold cross-validation when dealing with imbalanced classification targets.`,
        ],
      },
      {
        id: `ml_${stageNum}_3`,
        title: `${title}: Evaluation, Verification & Production Serving`,
        completed: false,
        subtopics: [
          `Rigorous metric evaluation (Precision, Recall, ROC-AUC, PR-AUC, F1-score)`,
          `Hyperparameter tuning, Bayesian optimization, and learning rate scheduling`,
          `Explainability and model interpretation using feature importance and SHAP values`,
          `Exporting models to optimized formats (ONNX, TorchScript) for fast inference`,
          `Monitoring model drift, concept shift, and input schema degradation in production`,
        ],
        explanation:
          `Evaluating machine learning models requires selecting metrics that reflect actual business objectives rather than naive accuracy. Imbalanced datasets require monitoring Precision-Recall curves and calibrating probability thresholds. In production, models must be exported to optimized inference engines and continuously monitored for data distribution shifts.`,
        keySyntaxOrApis: [
          `from sklearn.metrics import classification_report, roc_auc_score`,
          `# model.eval() with torch.no_grad() for inference`,
          `import onnxruntime as ort`,
        ],
        example: {
          title: `${title} Model Evaluation & Inference Benchmark`,
          description: `Demonstrating classification metrics computation and inference timing.`,
          codeOrWalkthrough:
            `import time\nimport numpy as np\nfrom sklearn.metrics import f1_score, precision_score, recall_score\n\ndef evaluate_predictions(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:\n    start = time.perf_counter()\n    p = float(precision_score(y_true, y_pred, zero_division=0))\n    r = float(recall_score(y_true, y_pred, zero_division=0))\n    f1 = float(f1_score(y_true, y_pred, zero_division=0))\n    duration_ms = (time.perf_counter() - start) * 1000\n    return {"precision": p, "recall": r, "f1": f1, "eval_duration_ms": duration_ms}\n\nif __name__ == "__main__":\n    y_t = np.array([1, 0, 1, 1, 0, 1])\n    y_p = np.array([1, 0, 1, 0, 0, 1])\n    print("Evaluation summary:", evaluate_predictions(y_t, y_p))`,
        },
        exercise: {
          title: `${title} Evaluation & Inference Benchmark Lab`,
          prompt: `Evaluate a trained model across multiple decision thresholds, generate an error analysis report of misclassified samples, and measure p95 inference latency.`,
          expectedOutcome: `Evaluation identifies optimal probability threshold maximizing F1-score with p95 latency under 25ms.`,
        },
        troubleshooting: [
          `Do not rely on accuracy for imbalanced datasets (e.g. 99% accuracy is trivial if 99% of samples are class 0).`,
          `Always disable gradient computation (torch.no_grad()) and set model.eval() during PyTorch inference.`,
        ],
      },
    ],
    commonMistakesAndTroubleshooting: [
      {
        mistake: `Fitting data preprocessing scalers or imputers on the entire dataset before splitting train and test sets`,
        consequence: "Causes severe data leakage that creates unrealistically optimistic validation scores while degrading real-world performance.",
        solutionOrFix: "Always execute train_test_split first, fit transformers strictly on X_train, and apply transform() to X_test.",
      },
      {
        mistake: `Using raw Accuracy to evaluate models trained on imbalanced datasets`,
        consequence: "A model that predicts the majority class for every sample will show high accuracy while failing entirely on the minority target of interest.",
        solutionOrFix: "Evaluate imbalanced datasets using PR-AUC (Precision-Recall Area Under Curve), F1-score, and cost-weighted confusion matrices.",
      },
      {
        mistake: `Forgetting to call model.eval() and with torch.no_grad() during PyTorch neural network evaluation`,
        consequence: "Dropout and BatchNorm layers continue behaving in training mode and computational graphs consume unnecessary GPU RAM, causing Out-Of-Memory crashes.",
        solutionOrFix: "Always wrap evaluation and inference blocks with 'model.eval()' and 'with torch.no_grad():'.",
      },
    ],
    knowledgeCheck: [
      {
        question: `Why is data leakage so dangerous in machine learning workflows, and how is it prevented in Stage ${stageNum}?`,
        options: [
          "It makes model serialization file sizes too large to store on disk",
          "It exposes information from the test dataset during training, resulting in overly optimistic validation scores that fail in production",
          "It forces Python to execute code in single-threaded mode",
          "It causes PyTorch tensors to fail GPU device placement",
        ],
        answerOrExplanation:
          "Option B: Data leakage occurs when information from outside the training dataset (such as test set mean/variance during scaling) leaks into model training. This leads to artificially high validation scores that collapse once the model encounters authentic unseen production data.",
        solutionRubric: "Candidate must explain how test information leaks into training and why it causes real-world failure.",
      },
      {
        question: `How do you systematically diagnose and resolve overfitting in Stage ${stageNum}?`,
        answerOrExplanation:
          "Compare training loss against validation loss; when training loss continues decreasing while validation loss rises, the model is overfitting. Mitigate by increasing regularization (L1/L2 penalties, Dropout, weight decay), gathering more training data, applying data augmentation, pruning tree depth, or utilizing early stopping callbacks.",
        solutionRubric: "Mentions train vs val loss divergence and multiple regularization/early stopping techniques.",
      },
      {
        question: `What distinguishes production-ready machine learning models from notebook prototypes in Stage ${stageNum}?`,
        answerOrExplanation:
          "Production-ready ML systems feature automated reproducible data pipelines (Scikit-Learn/PyTorch), automated test suites verifying model inputs/outputs, model serialization (ONNX/TorchScript), low-latency serving via FastAPI, and automated data/concept drift monitoring.",
        solutionRubric: "Identifies automated pipelines, testing, optimized serialization, fast serving, and drift monitoring.",
      },
    ],
    completionCriteria: [
      `All Stage ${stageNum} topic checklists verified and thoroughly understood`,
      `Milestone project implemented with passing automated test assertions and logged evaluation metrics`,
      `Code adheres strictly to PEP 8 standards with zero data leakage across splits`,
      `Stage self-assessment knowledge check answered accurately`,
    ],
    freeResources: [
      {
        title: `Official PyTorch Documentation & Tutorials`,
        url: "https://pytorch.org/tutorials/",
        platform: "PyTorch Foundation",
        type: "docs",
        isFree: true,
      },
      {
        title: "Scikit-Learn User Guide & Machine Learning Reference",
        url: "https://scikit-learn.org/stable/user_guide.html",
        platform: "Scikit-Learn",
        type: "docs",
        isFree: true,
      },
    ],
  };
}
