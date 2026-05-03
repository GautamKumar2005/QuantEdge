# Build script for the C++ Monte Carlo engine
# Run from the quant directory: bash cpp_engine/build.sh
set -e
CXX=${CXX:-g++}
CXXFLAGS="-O3 -std=c++17 -march=native"
SRC="cpp_engine/monte_carlo.cpp"
OUT="cpp_engine/monte_carlo_engine"

echo "Building C++ Monte Carlo engine..."
$CXX $CXXFLAGS -o $OUT $SRC
echo "Done → $OUT"
