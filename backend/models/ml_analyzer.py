"""
Machine Learning Analyzer for Options Trading.
Uses scikit-learn to cluster risk profiles and predict trade success probability based on Greeks.
"""
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans

# ── Synthesize Training Data for the ML Model ──
# In a real environment, this would be trained on historical option trades.
# Here we generate synthetic data representing realistic Option Greeks dynamics.

np.random.seed(42)
N_SAMPLES = 2000

# Features: [Delta, Gamma, Vega, Theta, Volatility, ExpiryDays]
X_train = np.zeros((N_SAMPLES, 6))
y_success = np.zeros(N_SAMPLES)

for i in range(N_SAMPLES):
    # Random realistic values
    delta = np.random.uniform(0.05, 0.95)
    gamma = np.random.uniform(0.001, 0.1)
    vega = np.random.uniform(0.01, 1.0)
    theta = np.random.uniform(-0.5, -0.01)
    vol = np.random.uniform(0.1, 1.0)
    dte = np.random.uniform(1, 365)
    
    X_train[i] = [delta, gamma, vega, theta, vol, dte]
    
    # Synthetic logic for "Trade Success" (binary classification)
    # Good trades: Delta > 0.4, low theta decay, high vega if vol is low, etc.
    score = (delta * 2) - (abs(theta) * (30 / dte)) + (vega if vol < 0.3 else -vega)
    y_success[i] = 1 if score > 0.8 else 0

# Train Models
rf_model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
rf_model.fit(X_train, y_success)

kmeans_model = KMeans(n_clusters=3, random_state=42, n_init=10)
kmeans_model.fit(X_train)

# Cluster Interpretations based on synthetic centroids
CLUSTER_LABELS = {
    0: "Low Risk / Steady Decay",
    1: "High Volatility / Directional",
    2: "Gamma Risk / Short-Term Explosive"
}

def analyze_trade(delta: float, gamma: float, vega: float, theta: float, vol: float, dte: int) -> dict:
    """
    Runs the trained ML models on the current option's parameters to generate an analysis report.
    """
    # Prepare features
    features = np.array([[abs(delta), gamma, vega, theta, vol, dte]])
    
    # 1. Predict Success Probability
    prob = rf_model.predict_proba(features)[0]
    success_prob = prob[1] * 100  # Probability of class 1
    
    # 2. Risk Clustering
    cluster_id = kmeans_model.predict(features)[0]
    risk_profile = CLUSTER_LABELS.get(cluster_id, "Unknown Risk Profile")
    
    # 3. Generate Analytical Insights
    insights = []
    
    if abs(delta) > 0.7:
        insights.append("Deep In-The-Money: High directional exposure. Acts almost like the underlying stock.")
    elif abs(delta) < 0.3:
        insights.append("Out-Of-The-Money: Low probability of expiring ITM. High leverage but risky.")
        
    if abs(theta) > 0.1 and dte < 15:
        insights.append("High Theta Decay: You are losing significant value every day. Bad for holding long.")
        
    if vega > 0.2 and vol < 0.25:
        insights.append("Low Volatility Environment: Excellent setup for a long volatility play (buying options).")
    elif vega > 0.2 and vol > 0.6:
        insights.append("High Volatility Environment: Options are expensive. Consider selling premium instead.")
        
    if gamma > 0.05 and dte < 10:
        insights.append("Gamma Squeeze Risk: Small stock movements will cause massive swings in option price.")

    if not insights:
        insights.append("Standard market conditions. No extreme Greek anomalies detected.")

    return {
        "success_probability": round(success_prob, 2),
        "risk_cluster": risk_profile,
        "feature_importance": {
            "Delta": round(rf_model.feature_importances_[0], 3),
            "Gamma": round(rf_model.feature_importances_[1], 3),
            "Vega":  round(rf_model.feature_importances_[2], 3),
            "Theta": round(rf_model.feature_importances_[3], 3),
            "Vol":   round(rf_model.feature_importances_[4], 3),
            "DTE":   round(rf_model.feature_importances_[5], 3)
        },
        "insights": insights
    }
