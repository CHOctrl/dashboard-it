interface PC {
  id: string;
  serial: string;
  branch: string;
  status: string;
}

const generateMockData = (count: number): PC[] => {
  const data: PC[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: `pc-${i}`,
      serial: `SERIAL-${i}`,
      branch: 'HQ',
      status: 'Imaging',
    });
  }
  return data;
};

const currentShuffle = (candidates: PC[]) => {
  return [...candidates].sort(() => 0.5 - Math.random());
};

const fisherYatesShuffle = (candidates: PC[]) => {
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const runBenchmark = () => {
  const sizes = [1000, 10000, 100000];

  console.log('Running Shuffle Benchmark...\n');

  for (const size of sizes) {
    console.log(`Dataset size: ${size}`);
    const data = generateMockData(size);

    // Measure Current Shuffle
    const startCurrent = performance.now();
    currentShuffle(data);
    const endCurrent = performance.now();
    const timeCurrent = endCurrent - startCurrent;
    console.log(`Current (sort): ${timeCurrent.toFixed(4)} ms`);

    // Measure Fisher-Yates Shuffle
    const startFY = performance.now();
    fisherYatesShuffle(data);
    const endFY = performance.now();
    const timeFY = endFY - startFY;
    console.log(`Fisher-Yates:   ${timeFY.toFixed(4)} ms`);

    const improvement = ((timeCurrent - timeFY) / timeCurrent) * 100;
    console.log(`Improvement:    ${improvement.toFixed(2)}%\n`);
  }
};

runBenchmark();
