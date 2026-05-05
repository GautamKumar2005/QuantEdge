/*
 * High-Performance Monte Carlo Option Pricing Engine (C++)
 * Uses Geometric Brownian Motion with Mersenne Twister RNG.
 * 
 * Usage:
 *   ./monte_carlo_engine S K T r sigma n_paths n_steps
 * 
 * Output: JSON to stdout
 * 
 * Compile:
 *   g++ -O3 -std=c++17 -o monte_carlo_engine monte_carlo.cpp
 */

#include <iostream>
#include <vector>
#include <random>
#include <cmath>
#include <algorithm>
#include <numeric>
#include <sstream>
#include <iomanip>

struct MCResult {
    double call_price;
    double put_price;
    double mean;
    double std_dev;
    double p5;
    double p95;
    std::vector<double> final_prices;
    std::vector<std::vector<double>> sampled_paths;
};

MCResult simulate(double S, double K, double T, double r, double sigma,
                  long long n_paths, int n_steps)
{
    const double dt     = T / n_steps;
    const double drift  = (r - 0.5 * sigma * sigma) * dt;
    const double vol_dt = sigma * std::sqrt(dt);
    const double discount = std::exp(-r * T);

    std::mt19937_64 rng(42);
    std::normal_distribution<double> normal(0.0, 1.0);

    bool store_prices = (n_paths <= 5000000);
    std::vector<double> final_prices;
    if (store_prices) {
        final_prices.resize(n_paths);
    }
    
    long long VIS_N = std::min(500LL, n_paths);
    std::vector<std::vector<double>> sampled_paths(VIS_N, std::vector<double>(n_steps + 1));

    double call_sum = 0.0, put_sum = 0.0;
    double mean = 0.0, M2 = 0.0;

    for (long long i = 0; i < n_paths; ++i) {
        double price = S;
        bool vis = (i < VIS_N);
        if (vis) sampled_paths[i][0] = price;

        for (int j = 0; j < n_steps; ++j) {
            price *= std::exp(drift + vol_dt * normal(rng));
            if (vis) sampled_paths[i][j + 1] = price;
        }

        if (store_prices) final_prices[i] = price;
        
        // Welford's online algorithm for variance
        double delta = price - mean;
        mean += delta / (i + 1);
        double delta2 = price - mean;
        M2 += delta * delta2;
        
        call_sum += std::max(price - K, 0.0);
        put_sum  += std::max(K - price, 0.0);
    }

    MCResult res;
    res.call_price = discount * call_sum / n_paths;
    res.put_price  = discount * put_sum  / n_paths;
    res.mean = mean;
    res.std_dev = std::sqrt(M2 / n_paths);
    
    if (store_prices) {
        std::sort(final_prices.begin(), final_prices.end());
        res.p5 = final_prices[(size_t)(0.05 * final_prices.size())];
        res.p95 = final_prices[(size_t)(0.95 * final_prices.size())];
    } else {
        // Analytical approx for percentiles if not stored
        double mu = std::log(S) + drift * n_steps;
        double sig = vol_dt * std::sqrt(n_steps);
        res.p5 = std::exp(mu - 1.64485 * sig);
        res.p95 = std::exp(mu + 1.64485 * sig);
    }

    res.final_prices = final_prices;
    res.sampled_paths = sampled_paths;
    return res;
}

// Simple histogram
std::pair<std::vector<double>, std::vector<double>>
make_histogram(const std::vector<double>& data, int bins = 60)
{
    if (data.empty()) return {{}, {}};
    double lo = data.front(); // Since it's sorted
    double hi = data.back();
    double width = (hi - lo) / bins;
    if (width == 0) width = 1e-6; // prevent div by zero
    
    std::vector<double> counts(bins, 0);
    for (double v : data) {
        int b = std::min((int)((v - lo) / width), bins - 1);
        counts[b]++;
    }
    double total = (double)data.size() * width;
    std::vector<double> centers(bins), density(bins);
    for (int i = 0; i < bins; ++i) {
        centers[i] = lo + (i + 0.5) * width;
        density[i] = counts[i] / total;
    }
    return {centers, density};
}

int main(int argc, char* argv[]) {
    if (argc < 8) {
        std::cerr << "Usage: " << argv[0]
                  << " S K T r sigma n_paths n_steps\n";
        return 1;
    }

    double S      = std::stod(argv[1]);
    double K      = std::stod(argv[2]);
    double T      = std::stod(argv[3]);
    double r      = std::stod(argv[4]);
    double sigma  = std::stod(argv[5]);
    long long n_paths   = std::stoll(argv[6]);
    int n_steps   = std::stoi(argv[7]);

    auto res = simulate(S, K, T, r, sigma, n_paths, n_steps);
    
    std::vector<double> hist_centers, hist_density;
    if (!res.final_prices.empty()) {
        auto h = make_histogram(res.final_prices);
        hist_centers = h.first;
        hist_density = h.second;
    }

    // Build JSON output
    std::ostringstream out;
    out << std::fixed << std::setprecision(4);
    out << "{\n";
    out << "  \"call_price\": " << res.call_price << ",\n";
    out << "  \"put_price\": "  << res.put_price  << ",\n";
    out << "  \"n_paths\": " << n_paths << ",\n";

    // Histogram
    out << "  \"histogram\": {\n";
    out << "    \"prices\": [";
    for (size_t i = 0; i < hist_centers.size(); ++i) {
        out << hist_centers[i];
        if (i + 1 < hist_centers.size()) out << ",";
    }
    out << "],\n    \"density\": [";
    for (size_t i = 0; i < hist_density.size(); ++i) {
        out << hist_density[i];
        if (i + 1 < hist_density.size()) out << ",";
    }
    out << "]\n  },\n";

    // Stats
    out << "  \"final_prices_stats\": {\n";
    out << "    \"mean\": " << res.mean << ",\n";
    out << "    \"std\":  " << res.std_dev << ",\n";
    out << "    \"p5\":   " << res.p5  << ",\n";
    out << "    \"p95\":  " << res.p95 << "\n";
    out << "  },\n";

    // Sampled paths (just first 100 for JSON size)
    int export_paths = std::min((int)res.sampled_paths.size(), 100);
    int step_stride  = std::max(1, n_steps / 50); // downsample steps
    out << "  \"paths\": [\n";
    for (int i = 0; i < export_paths; ++i) {
        out << "    [";
        for (int j = 0; j <= n_steps; j += step_stride) {
            out << std::setprecision(2) << res.sampled_paths[i][j];
            if (j + step_stride <= n_steps) out << ",";
        }
        out << "]";
        if (i + 1 < export_paths) out << ",";
        out << "\n";
    }
    out << "  ]\n";
    out << "}\n";

    std::cout << out.str();
    return 0;
}
