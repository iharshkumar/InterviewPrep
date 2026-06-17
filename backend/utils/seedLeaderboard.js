const User = require('../models/User');

const COLLEGES_LIST = [
  'PESCE',
  'MIT,Mysore',
  'BIT,Bengaluru',
  'DSCE,Bengaluru',
  'RVCE,Bengalurur'
];

const MOCK_CANDIDATES = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    college: 'PESCE',
    branch: 'CSE',
    batch: '2026',
    year: '3rd Year',
    streak: 15,
    role: 'Full Stack Engineer',
    githubHandle: 'aaravs_git',
    leetcodeHandle: 'aarav_lc',
    codeforcesHandle: 'aarav_cf',
    codechefHandle: 'aarav_cc',
    gfgHandle: 'aarav_gfg',
    githubStats: { repositories: 32, followers: 85, totalStars: 18, contributions: 240 },
    leetcodeStats: { totalSolved: 285, easySolved: 110, mediumSolved: 130, hardSolved: 45, contestRating: 1840 },
    codeforcesStats: { currentRating: 1620, problemsSolved: 145 },
    codechefStats: { rating: 1750, problemsSolved: 90 },
    gfgStats: { score: 450, problemsSolved: 110 }
  },
  {
    name: 'Ananya Iyer',
    email: 'ananya.iyer@example.com',
    college: 'MIT,Mysore',
    branch: 'CSE',
    batch: '2025',
    year: '4th Year',
    streak: 32,
    role: 'Algorithms Researcher',
    githubHandle: 'ananya_dev',
    leetcodeHandle: 'ananya_leetcode',
    codeforcesHandle: 'ananya_forces',
    codechefHandle: 'ananya_chef',
    gfgHandle: 'ananya_gfg',
    githubStats: { repositories: 45, followers: 150, totalStars: 64, contributions: 512 },
    leetcodeStats: { totalSolved: 410, easySolved: 120, mediumSolved: 210, hardSolved: 80, contestRating: 2210 },
    codeforcesStats: { currentRating: 2050, problemsSolved: 280 },
    codechefStats: { rating: 2150, problemsSolved: 130 },
    gfgStats: { score: 680, problemsSolved: 175 }
  },
  {
    name: 'Aditya Patel',
    email: 'aditya.patel@example.com',
    college: 'BIT,Bengaluru',
    branch: 'ISE',
    batch: '2026',
    year: '3rd Year',
    streak: 22,
    role: 'Backend Engineer',
    githubHandle: 'aditya_back',
    leetcodeHandle: 'adityap_lc',
    codeforcesHandle: 'aditya_cf',
    codechefHandle: 'aditya_chef',
    gfgHandle: 'aditya_gfg',
    githubStats: { repositories: 24, followers: 42, totalStars: 12, contributions: 180 },
    leetcodeStats: { totalSolved: 210, easySolved: 80, mediumSolved: 110, hardSolved: 20, contestRating: 1590 },
    codeforcesStats: { currentRating: 1420, problemsSolved: 85 },
    codechefStats: { rating: 1520, problemsSolved: 65 },
    gfgStats: { score: 320, problemsSolved: 80 }
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reddy@example.com',
    college: 'DSCE,Bengaluru',
    branch: 'ECE',
    batch: '2027',
    year: '2nd Year',
    streak: 8,
    role: 'Embedded Dev',
    githubHandle: 'snehareddy_gh',
    leetcodeHandle: 'sneha_lc',
    codechefHandle: 'sneha_cc',
    githubStats: { repositories: 15, followers: 28, totalStars: 5, contributions: 95 },
    leetcodeStats: { totalSolved: 135, easySolved: 75, mediumSolved: 50, hardSolved: 10, contestRating: 1420 },
    codechefStats: { rating: 1380, problemsSolved: 35 }
  },
  {
    name: 'Rahul Verma',
    email: 'rahul.verma@example.com',
    college: 'RVCE,Bengalurur',
    branch: 'CSE',
    batch: '2025',
    year: '4th Year',
    streak: 19,
    role: 'Software Engineer',
    githubHandle: 'rahulv_git',
    leetcodeHandle: 'rahul_lc',
    codeforcesHandle: 'rahul_cf',
    githubStats: { repositories: 29, followers: 60, totalStars: 22, contributions: 310 },
    leetcodeStats: { totalSolved: 320, easySolved: 90, mediumSolved: 180, hardSolved: 50, contestRating: 1950 },
    codeforcesStats: { currentRating: 1780, problemsSolved: 190 }
  },
  {
    name: 'Priya Sen',
    email: 'priya.sen@example.com',
    college: 'PESCE',
    branch: 'CSE',
    batch: '2026',
    year: '3rd Year',
    streak: 41,
    role: 'Frontend Architect',
    githubHandle: 'priyasen_dev',
    leetcodeHandle: 'priya_lc',
    codeforcesHandle: 'priya_cf',
    codechefHandle: 'priya_cc',
    gfgHandle: 'priya_gfg',
    githubStats: { repositories: 38, followers: 110, totalStars: 35, contributions: 420 },
    leetcodeStats: { totalSolved: 345, easySolved: 100, mediumSolved: 195, hardSolved: 50, contestRating: 2010 },
    codeforcesStats: { currentRating: 1850, problemsSolved: 210 },
    codechefStats: { rating: 1920, problemsSolved: 115 },
    gfgStats: { score: 540, problemsSolved: 130 }
  },
  {
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@example.com',
    college: 'MIT,Mysore',
    branch: 'ECE',
    batch: '2025',
    year: '4th Year',
    streak: 0,
    role: 'DevOps Engineer',
    githubHandle: 'vikram_ops',
    leetcodeHandle: 'vikram_lc',
    githubStats: { repositories: 52, followers: 75, totalStars: 48, contributions: 340 },
    leetcodeStats: { totalSolved: 180, easySolved: 90, mediumSolved: 80, hardSolved: 10, contestRating: 1510 }
  },
  {
    name: 'Kabir Gupta',
    email: 'kabir.gupta@example.com',
    college: 'BIT,Bengaluru',
    branch: 'CSE',
    batch: '2026',
    year: '3rd Year',
    streak: 28,
    role: 'Machine Learning Engineer',
    githubHandle: 'kabirg_ml',
    leetcodeHandle: 'kabir_lc',
    codeforcesHandle: 'kabir_cf',
    githubStats: { repositories: 19, followers: 98, totalStars: 42, contributions: 280 },
    leetcodeStats: { totalSolved: 310, easySolved: 85, mediumSolved: 165, hardSolved: 60, contestRating: 2100 },
    codeforcesStats: { currentRating: 1920, problemsSolved: 170 }
  },
  {
    name: 'Ishaan Joshi',
    email: 'ishaan.joshi@example.com',
    college: 'DSCE,Bengaluru',
    branch: 'ICE',
    batch: '2027',
    year: '2nd Year',
    streak: 5,
    role: 'Android Developer',
    githubHandle: 'ishaan_droid',
    leetcodeHandle: 'ishaan_lc',
    gfgHandle: 'ishaan_gfg',
    githubStats: { repositories: 14, followers: 15, totalStars: 3, contributions: 65 },
    leetcodeStats: { totalSolved: 95, easySolved: 60, mediumSolved: 30, hardSolved: 5, contestRating: 1250 },
    gfgStats: { score: 210, problemsSolved: 55 }
  },
  {
    name: 'Diya Nair',
    email: 'diya.nair@example.com',
    college: 'RVCE,Bengalurur',
    branch: 'ISE',
    batch: '2026',
    year: '3rd Year',
    streak: 18,
    role: 'Cybersecurity Analyst',
    githubHandle: 'diya_sec',
    leetcodeHandle: 'diya_lc',
    codeforcesHandle: 'diya_cf',
    codechefHandle: 'diya_cc',
    githubStats: { repositories: 18, followers: 35, totalStars: 10, contributions: 120 },
    leetcodeStats: { totalSolved: 220, easySolved: 90, mediumSolved: 110, hardSolved: 20, contestRating: 1610 },
    codeforcesStats: { currentRating: 1390, problemsSolved: 75 },
    codechefStats: { rating: 1480, problemsSolved: 50 }
  },
  {
    name: 'Rohan Deshmukh',
    email: 'rohan.d@example.com',
    college: 'PESCE',
    branch: 'ME',
    batch: '2025',
    year: '4th Year',
    streak: 10,
    role: 'Robotics Programmer',
    githubHandle: 'rohan_robo',
    leetcodeHandle: 'rohan_lc',
    githubStats: { repositories: 22, followers: 30, totalStars: 8, contributions: 150 },
    leetcodeStats: { totalSolved: 160, easySolved: 80, mediumSolved: 70, hardSolved: 10, contestRating: 1480 }
  },
  {
    name: 'Kriti Saxena',
    email: 'kriti.s@example.com',
    college: 'MIT,Mysore',
    branch: 'CSE',
    batch: '2026',
    year: '3rd Year',
    streak: 35,
    role: 'Compiler Engineer',
    githubHandle: 'kriti_comp',
    leetcodeHandle: 'kriti_lc',
    codeforcesHandle: 'kriti_cf',
    codechefHandle: 'kriti_cc',
    gfgHandle: 'kriti_gfg',
    githubStats: { repositories: 27, followers: 120, totalStars: 55, contributions: 490 },
    leetcodeStats: { totalSolved: 380, easySolved: 90, mediumSolved: 210, hardSolved: 80, contestRating: 2250 },
    codeforcesStats: { currentRating: 2010, problemsSolved: 245 },
    codechefStats: { rating: 2080, problemsSolved: 125 },
    gfgStats: { score: 610, problemsSolved: 150 }
  },
  {
    name: 'Abhishek Mishra',
    email: 'abhishek.m@example.com',
    college: 'BIT,Bengaluru',
    branch: 'ECE',
    batch: '2026',
    year: '3rd Year',
    streak: 14,
    role: 'Network Engineer',
    githubHandle: 'abhim_net',
    leetcodeHandle: 'abhi_lc',
    codechefHandle: 'abhi_cc',
    githubStats: { repositories: 16, followers: 22, totalStars: 4, contributions: 110 },
    leetcodeStats: { totalSolved: 145, easySolved: 70, mediumSolved: 65, hardSolved: 10, contestRating: 1390 },
    codechefStats: { rating: 1410, problemsSolved: 40 }
  },
  {
    name: 'Tanvi Shah',
    email: 'tanvi.shah@example.com',
    college: 'DSCE,Bengaluru',
    branch: 'CSE',
    batch: '2027',
    year: '2nd Year',
    streak: 20,
    role: 'Web Developer',
    githubHandle: 'tanvi_web',
    leetcodeHandle: 'tanvi_lc',
    gfgHandle: 'tanvi_gfg',
    githubStats: { repositories: 18, followers: 40, totalStars: 14, contributions: 165 },
    leetcodeStats: { totalSolved: 190, easySolved: 90, mediumSolved: 85, hardSolved: 15, contestRating: 1520 },
    gfgStats: { score: 290, problemsSolved: 75 }
  },
  {
    name: 'Arjun Das',
    email: 'arjun.das@example.com',
    college: 'RVCE,Bengalurur',
    branch: 'EE',
    batch: '2025',
    year: '4th Year',
    streak: 45,
    role: 'Quantitative Analyst',
    githubHandle: 'arjun_quant',
    leetcodeHandle: 'arjun_lc',
    codeforcesHandle: 'arjun_cf',
    githubStats: { repositories: 25, followers: 80, totalStars: 30, contributions: 380 },
    leetcodeStats: { totalSolved: 370, easySolved: 100, mediumSolved: 200, hardSolved: 70, contestRating: 2180 },
    codeforcesStats: { currentRating: 2110, problemsSolved: 260 }
  }
];

const calculateScoreForSeeding = (stats) => {
  const gh = stats.github || {};
  const lc = stats.leetcode || {};
  const cf = stats.codeforces || {};
  const cc = stats.codechef || {};
  const gfg = stats.gfg || {};

  const ghScore = Math.round(Math.min((gh.totalStars || 0) * 20 + (gh.contributions || 0) * 1.5 + (gh.repositories || 0) * 3, 1000));
  const lcScore = Math.round(Math.min((lc.totalSolved || 0) * 3 + (lc.contestRating || 0) * 0.4, 1000));
  const cfScore = Math.round(Math.min((cf.currentRating || 0) * 0.5 + (cf.problemsSolved || 0) * 3, 1000));
  const ccScore = Math.round(Math.min((cc.rating || 0) * 0.5 + (cc.problemsSolved || 0) * 3, 1000));
  const gfgScore = Math.round(Math.min((gfg.score || 0) + (gfg.problemsSolved || 0) * 2, 1000));

  return {
    ghScore,
    lcScore,
    cfScore,
    ccScore,
    gfgScore,
    total: ghScore + lcScore + cfScore + ccScore + gfgScore
  };
};

const seedIfEmpty = async () => {
  try {
    // Clear old seeded mock users to ensure only real database entries exist
    const deleteResult = await User.deleteMany({ firebaseUid: { $regex: /^mock-uid-seed-/ } });
    console.log(`Leaderboard seeder: Cleaned up ${deleteResult.deletedCount} mock seeded users from the database.`);
  } catch (error) {
    console.error('Leaderboard seeder cleanup failed:', error);
  }
};

module.exports = {
  seedIfEmpty
};
