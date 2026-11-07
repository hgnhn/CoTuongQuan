#!/usr/bin/env bash
# Chạy đo cân bằng song song theo nhóm loại quân. Dùng: bash tests/run-balance.sh [ván] [ms]
cd "$(dirname "$0")/.."
G=${1:-32}; MS=${2:-40}
for grp in K,A E,R C,H P; do
  node tests/balance.js "$G" "$MS" "$grp" > "/tmp/ctq-bal-$grp.txt" 2>&1 &
done
wait
for grp in K,A E,R C,H P; do grep -E "^\s+\S+\s+.+\s0\.[0-9]+|1\.00" "/tmp/ctq-bal-$grp.txt" | grep "(" ; done
