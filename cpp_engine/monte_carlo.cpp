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
    std::vector<double> final_prices;
    // sampled paths (500 max for visualization)
    std::vector<std::vector<double>> sampled_paths;
};

MCResult simulate(double S, double K, double T, double r, double sigma,
                  int n_paths, int n_steps)
{
    const double dt     = T / n_steps;
    const double drift  = (r - 0.5 * sigma * sigma) * dt;
    const double vol_dt = sigma * std::sqrt(dt);
    const double discount = std::exp(-r * T);

    std::mt19937_64 rng(42);
    std::normal_distribution<double> normal(0.0, 1.0);

    std::vector<double> final_prices(n_paths);
    const int VIS_N = std::min(500, n_paths);
    std::vector<std::vector<double>> sampled_paths(VIS_N, std::vector<double>(n_steps + 1));

    double call_sum = 0.0, put_sum = 0.0;

    for (int i = 0; i < n_paths; ++i) {
        double price = S;
        bool vis = (i < VIS_N);
        if (vis) sampled_paths[i][0] = price;

        for (int j = 0; j < n_steps; ++j) {
            price *= std::exp(drift + vol_dt * normal(rng));
            if (vis) sampled_paths[i][j + 1] = price;
        }

        final_prices[i] = price;
        call_sum += std::max(price - K, 0.0);
        put_sum  += std::max(K - price, 0.0);
    }

    MCResult res;
    res.call_price = discount * call_sum / n_paths;
    res.put_price  = discount * put_sum  / n_paths;
    res.final_prices = final_prices;
    res.sampled_paths = sampled_paths;
    return res;
}

// Simple histogram
std::pair<std::vector<double>, std::vector<double>>
make_histogram(const std::vector<double>& data, int bins = 60)
{
    double lo = *std::min_element(data.begin(), data.end());
    double hi = *std::max_element(data.begin(), data.end());
    double width = (hi - lo) / bins;
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
    int n_paths   = std::stoi(argv[6]);
    int n_steps   = std::stoi(argv[7]);

    auto res = simulate(S, K, T, r, sigma, n_paths, n_steps);
    auto [hist_centers, hist_density] = make_histogram(res.final_prices);

    std::vector<double>& fp = res.final_prices;
    std::sort(fp.begin(), fp.end());
    double mean = std::accumulate(fp.begin(), fp.end(), 0.0) / fp.size();
    double sq_sum = 0;
    for (double v : fp) sq_sum += (v - mean) * (v - mean);
    double std_dev = std::sqrt(sq_sum / fp.size());
    double p5  = fp[(int)(0.05 * fp.size())];
    double p95 = fp[(int)(0.95 * fp.size())];

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
    out << "    \"mean\": " << mean << ",\n";
    out << "    \"std\":  " << std_dev << ",\n";
    out << "    \"p5\":   " << p5  << ",\n";
    out << "    \"p95\":  " << p95 << "\n";
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
