export const dsaQuestions = {
  easy: [
    {
      id: "two-sum",
      title: "Two Sum",
      difficulty: "Easy",
      description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
      constraints: [
        "2 <= nums.length <= 10^4",
        "-10^9 <= nums[i] <= 10^9",
        "-10^9 <= target <= 10^9",
        "Only one valid answer exists."
      ],
      functionName: "twoSum",
      starterCode: `function twoSum(nums, target) {
  // Write your code here
  
}`,
      examples: [
        {
          input: "nums = [2,7,11,15], target = 9",
          output: "[0,1]",
          explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
        },
        {
          input: "nums = [3,2,4], target = 6",
          output: "[1,2]"
        }
      ],
      testCases: [
        { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
        { input: [[3, 2, 4], 6], expected: [1, 2] },
        { input: [[3, 3], 6], expected: [0, 1] }
      ]
    },
    {
      id: "reverse-string",
      title: "Reverse a String",
      difficulty: "Easy",
      description: "Write a function that reverses a string. The input string is given as `s`. Return the reversed string.",
      constraints: [
        "1 <= s.length <= 10^5",
        "s consists of printable ASCII characters."
      ],
      functionName: "reverseString",
      starterCode: `function reverseString(s) {
  // Write your code here
  
}`,
      examples: [
        {
          input: 's = "hello"',
          output: '"olleh"'
        },
        {
          input: 's = "Hannah"',
          output: '"hannaH"'
        }
      ],
      testCases: [
        { input: ["hello"], expected: "olleh" },
        { input: ["Hannah"], expected: "hannaH" },
        { input: ["a"], expected: "a" }
      ]
    },
    {
      id: "palindrome-number",
      title: "Palindrome Number",
      difficulty: "Easy",
      description: "Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.\n\nAn integer is a palindrome when it reads the same backward as forward. For example, `121` is a palindrome while `123` is not.",
      constraints: [
        "-2^31 <= x <= 2^31 - 1"
      ],
      functionName: "isPalindrome",
      starterCode: `function isPalindrome(x) {
  // Write your code here
  
}`,
      examples: [
        {
          input: "x = 121",
          output: "true",
          explanation: "121 reads as 121 from left to right and from right to left."
        },
        {
          input: "x = -121",
          output: "false",
          explanation: "From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome."
        }
      ],
      testCases: [
        { input: [121], expected: true },
        { input: [-121], expected: false },
        { input: [10], expected: false }
      ]
    },
    {
      id: "contains-duplicate",
      title: "Contains Duplicate",
      difficulty: "Easy",
      description: "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
      constraints: [
        "1 <= nums.length <= 10^5",
        "-10^9 <= nums[i] <= 10^9"
      ],
      functionName: "containsDuplicate",
      starterCode: `function containsDuplicate(nums) {
  // Write your code here
  
}`,
      examples: [
        {
          input: "nums = [1,2,3,1]",
          output: "true"
        },
        {
          input: "nums = [1,2,3,4]",
          output: "false"
        }
      ],
      testCases: [
        { input: [[1, 2, 3, 1]], expected: true },
        { input: [[1, 2, 3, 4]], expected: false },
        { input: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true }
      ]
    }
  ],
  medium: [
    {
      id: "valid-parentheses",
      title: "Valid Parentheses",
      difficulty: "Medium",
      description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
      constraints: [
        "1 <= s.length <= 10^4",
        "s consists of parentheses only '()[]{}'."
      ],
      functionName: "isValid",
      starterCode: `function isValid(s) {
  // Write your code here
  
}`,
      examples: [
        {
          input: 's = "()"',
          output: "true"
        },
        {
          input: 's = "()[]{}"',
          output: "true"
        },
        {
          input: 's = "(]"',
          output: "false"
        }
      ],
      testCases: [
        { input: ["()"], expected: true },
        { input: ["()[]{}"], expected: true },
        { input: ["(]"], expected: false },
        { input: ["([)]"], expected: false },
        { input: ["{[]}"], expected: true }
      ]
    },
    {
      id: "longest-substring",
      title: "Longest Substring Without Repeating Characters",
      difficulty: "Medium",
      description: "Given a string `s`, find the length of the longest substring without repeating characters.",
      constraints: [
        "0 <= s.length <= 5 * 10^4",
        "s consists of English letters, digits, symbols and spaces."
      ],
      functionName: "lengthOfLongestSubstring",
      starterCode: `function lengthOfLongestSubstring(s) {
  // Write your code here
  
}`,
      examples: [
        {
          input: 's = "abcabcbb"',
          output: "3",
          explanation: "The answer is \"abc\", with the length of 3."
        },
        {
          input: 's = "bbbbb"',
          output: "1",
          explanation: "The answer is \"b\", with the length of 1."
        }
      ],
      testCases: [
        { input: ["abcabcbb"], expected: 3 },
        { input: ["bbbbb"], expected: 1 },
        { input: ["pwwkew"], expected: 3 },
        { input: [""], expected: 0 }
      ]
    },
    {
      id: "container-most-water",
      title: "Container With Most Water",
      difficulty: "Medium",
      description: "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`-th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.",
      constraints: [
        "n == height.length",
        "2 <= n <= 10^5",
        "0 <= height[i] <= 10^4"
      ],
      functionName: "maxArea",
      starterCode: `function maxArea(height) {
  // Write your code here
  
}`,
      examples: [
        {
          input: "height = [1,8,6,2,5,4,8,3,7]",
          output: "49",
          explanation: "The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water the container can contain is 49."
        },
        {
          input: "height = [1,1]",
          output: "1"
        }
      ],
      testCases: [
        { input: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 },
        { input: [[1, 1]], expected: 1 },
        { input: [[4, 3, 2, 1, 4]], expected: 16 }
      ]
    },
    {
      id: "two-sum-sorted",
      title: "Two Sum II - Input Array Is Sorted",
      difficulty: "Medium",
      description: "Given a 1-indexed array of integers `numbers` that is already sorted in non-decreasing order, find two numbers such that they add up to a specific `target` number.\n\nReturn the indices of the two numbers, index1 and index2, added by one as an integer array `[index1, index2]` of length 2.\n\nThe tests are generated such that there is exactly one solution. You may not use the same element twice.",
      constraints: [
        "2 <= numbers.length <= 3 * 10^4",
        "-1000 <= numbers[i] <= 1000",
        "numbers is sorted in non-decreasing order.",
        "-1000 <= target <= 1000",
        "The tests are generated such that there is exactly one solution."
      ],
      functionName: "twoSumSorted",
      starterCode: `function twoSumSorted(numbers, target) {
  // Write your code here
  
}`,
      examples: [
        {
          input: "numbers = [2,7,11,15], target = 9",
          output: "[1,2]",
          explanation: "The sum of 2 and 7 is 9. Therefore, index1 = 1, index2 = 2. We return [1, 2]."
        },
        {
          input: "numbers = [2,3,4], target = 6",
          output: "[1,3]"
        }
      ],
      testCases: [
        { input: [[2, 7, 11, 15], 9], expected: [1, 2] },
        { input: [[2, 3, 4], 6], expected: [1, 3] },
        { input: [[-1, 0], -1], expected: [1, 2] }
      ]
    }
  ],
  hard: [
    {
      id: "merge-k-arrays",
      title: "Merge Sorted Arrays (Flatten & Sort)",
      difficulty: "Hard",
      description: "Given an array of sorted arrays `arrays`, merge all the sub-arrays into one single sorted array and return it.\n\nThe final array should remain sorted in non-decreasing order.",
      constraints: [
        "k == arrays.length",
        "0 <= k <= 100",
        "0 <= arrays[i].length <= 500",
        "-10^4 <= arrays[i][j] <= 10^4",
        "arrays[i] is sorted in ascending order."
      ],
      functionName: "mergeKSortedArrays",
      starterCode: `function mergeKSortedArrays(arrays) {
  // Write your code here
  
}`,
      examples: [
        {
          input: "arrays = [[1,4,5],[1,3,4],[2,6]]",
          output: "[1,1,2,3,4,4,5,6]"
        },
        {
          input: "arrays = []",
          output: "[]"
        }
      ],
      testCases: [
        { input: [[[1, 4, 5], [1, 3, 4], [2, 6]]], expected: [1, 1, 2, 3, 4, 4, 5, 6] },
        { input: [[]], expected: [] },
        { input: [[[1], [2], [3]]], expected: [1, 2, 3] }
      ]
    },
    {
      id: "median-two-arrays",
      title: "Median of Two Sorted Arrays",
      difficulty: "Hard",
      description: "Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).",
      constraints: [
        "nums1.length == m",
        "nums2.length == n",
        "0 <= m <= 1000",
        "0 <= n <= 1000",
        "1 <= m + n <= 2000",
        "-10^6 <= nums1[i], nums2[i] <= 10^6"
      ],
      functionName: "findMedianSortedArrays",
      starterCode: `function findMedianSortedArrays(nums1, nums2) {
  // Write your code here
  
}`,
      examples: [
        {
          input: "nums1 = [1,3], nums2 = [2]",
          output: "2.00000",
          explanation: "merged array = [1,2,3] and median is 2."
        },
        {
          input: "nums1 = [1,2], nums2 = [3,4]",
          output: "2.50000",
          explanation: "merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5."
        }
      ],
      testCases: [
        { input: [[1, 3], [2]], expected: 2 },
        { input: [[1, 2], [3, 4]], expected: 2.5 },
        { input: [[0, 0], [0, 0]], expected: 0 }
      ]
    },
    {
      id: "edit-distance",
      title: "Edit Distance",
      difficulty: "Hard",
      description: "Given two strings `word1` and `word2`, return the minimum number of operations required to convert `word1` to `word2`.\n\nYou have the following three operations permitted on a word:\n1. Insert a character\n2. Delete a character\n3. Replace a character",
      constraints: [
        "0 <= word1.length, word2.length <= 500",
        "word1 and word2 consist of lowercase English letters."
      ],
      functionName: "minDistance",
      starterCode: `function minDistance(word1, word2) {
  // Write your code here
  
}`,
      examples: [
        {
          input: 'word1 = "horse", word2 = "ros"',
          output: "3",
          explanation: "horse -> rorse (replace 'h' with 'r')\nrorse -> rose (remove 'r')\nrose -> ros (remove 'e')"
        },
        {
          input: 'word1 = "intention", word2 = "execution"',
          output: "5"
        }
      ],
      testCases: [
        { input: ["horse", "ros"], expected: 3 },
        { input: ["intention", "execution"], expected: 5 },
        { input: ["", ""], expected: 0 },
        { input: ["a", ""], expected: 1 }
      ]
    },
    {
      id: "first-missing-positive",
      title: "First Missing Positive",
      difficulty: "Hard",
      description: "Given an unsorted integer array `nums`, return the smallest missing positive integer.\n\nYou must implement an algorithm that runs in O(n) time and uses O(1) auxiliary space.",
      constraints: [
        "1 <= nums.length <= 10^5",
        "-2^31 <= nums[i] <= 2^31 - 1"
      ],
      functionName: "firstMissingPositive",
      starterCode: `function firstMissingPositive(nums) {
  // Write your code here
  
}`,
      examples: [
        {
          input: "nums = [1,2,0]",
          output: "3",
          explanation: "The numbers in the range [1,2] are all in the array. 3 is the smallest positive integer."
        },
        {
          input: "nums = [3,4,-1,1]",
          output: "2",
          explanation: "1 is in the array but 2 is missing."
        }
      ],
      testCases: [
        { input: [[1, 2, 0]], expected: 3 },
        { input: [[3, 4, -1, 1]], expected: 2 },
        { input: [[7, 8, 9, 11, 12]], expected: 1 }
      ]
    }
  ]
};
