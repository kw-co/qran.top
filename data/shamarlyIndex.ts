/**
 * Shamarly Mushaf (مصحف الشمرلي - الطبعة المصرية الشهيرة 522 صفحة)
 * Index mappings between Surah/Ayah and Shamarly page numbers.
 */

export const SHAMARLY_TOTAL_PAGES = 522;

export const SHAMARLY_SURAH_START_PAGES: Record<number, number> = {
  "1": 2,
  "2": 3,
  "3": 42,
  "4": 64,
  "5": 87,
  "6": 105,
  "7": 123,
  "8": 145,
  "9": 153,
  "10": 169,
  "11": 181,
  "12": 193,
  "13": 205,
  "14": 210,
  "15": 216,
  "16": 221,
  "17": 233,
  "18": 243,
  "19": 253,
  "20": 260,
  "21": 268,
  "22": 276,
  "23": 284,
  "24": 291,
  "25": 300,
  "26": 306,
  "27": 315,
  "28": 323,
  "29": 332,
  "30": 338,
  "31": 344,
  "32": 347,
  "33": 350,
  "34": 358,
  "35": 364,
  "36": 369,
  "37": 374,
  "38": 380,
  "39": 385,
  "40": 392,
  "41": 400,
  "42": 405,
  "43": 411,
  "44": 417,
  "45": 419,
  "46": 423,
  "47": 427,
  "48": 430,
  "49": 434,
  "50": 437,
  "51": 439,
  "52": 442,
  "53": 444,
  "54": 447,
  "55": 449,
  "56": 452,
  "57": 455,
  "58": 459,
  "59": 462,
  "60": 466,
  "61": 468,
  "62": 469,
  "63": 471,
  "64": 472,
  "65": 474,
  "66": 476,
  "67": 478,
  "68": 480,
  "69": 482,
  "70": 484,
  "71": 486,
  "72": 488,
  "73": 490,
  "74": 491,
  "75": 493,
  "76": 495,
  "77": 497,
  "78": 498,
  "79": 500,
  "80": 501,
  "81": 502,
  "82": 503,
  "83": 504,
  "84": 505,
  "85": 506,
  "86": 507,
  "87": 508,
  "88": 509,
  "89": 510,
  "90": 511,
  "91": 512,
  "92": 512,
  "93": 513,
  "94": 514,
  "95": 514,
  "96": 514,
  "97": 515,
  "98": 516,
  "99": 516,
  "100": 517,
  "101": 517,
  "102": 518,
  "103": 518,
  "104": 519,
  "105": 519,
  "106": 520,
  "107": 520,
  "108": 520,
  "109": 521,
  "110": 521,
  "111": 521,
  "112": 522,
  "113": 522,
  "114": 522
};

export const SHAMARLY_JUZ_START_PAGES: Record<number, number> = {
  "1": 2,
  "2": 20,
  "3": 36,
  "4": 52,
  "5": 68,
  "6": 84,
  "7": 99,
  "8": 116,
  "9": 132,
  "10": 148,
  "11": 164,
  "12": 181,
  "13": 199,
  "14": 216,
  "15": 233,
  "16": 250,
  "17": 268,
  "18": 284,
  "19": 302,
  "20": 320,
  "21": 336,
  "22": 353,
  "23": 370,
  "24": 388,
  "25": 404,
  "26": 423,
  "27": 440,
  "28": 459,
  "29": 478,
  "30": 498
};

export interface ShamarlyPageSegment {
  surah: number;
  startAyah: number;
  endAyah: number;
}

export const SHAMARLY_PAGE_SEGMENTS: Record<number, ShamarlyPageSegment[]> = {
  "2": [
    {
      "surah": 1,
      "startAyah": 1,
      "endAyah": 7
    }
  ],
  "3": [
    {
      "surah": 2,
      "startAyah": 1,
      "endAyah": 4
    }
  ],
  "4": [
    {
      "surah": 2,
      "startAyah": 5,
      "endAyah": 15
    }
  ],
  "5": [
    {
      "surah": 2,
      "startAyah": 16,
      "endAyah": 23
    }
  ],
  "6": [
    {
      "surah": 2,
      "startAyah": 24,
      "endAyah": 29
    }
  ],
  "7": [
    {
      "surah": 2,
      "startAyah": 30,
      "endAyah": 38
    }
  ],
  "8": [
    {
      "surah": 2,
      "startAyah": 39,
      "endAyah": 49
    }
  ],
  "9": [
    {
      "surah": 2,
      "startAyah": 50,
      "endAyah": 59
    }
  ],
  "10": [
    {
      "surah": 2,
      "startAyah": 60,
      "endAyah": 64
    }
  ],
  "11": [
    {
      "surah": 2,
      "startAyah": 65,
      "endAyah": 74
    }
  ],
  "12": [
    {
      "surah": 2,
      "startAyah": 75,
      "endAyah": 82
    }
  ],
  "13": [
    {
      "surah": 2,
      "startAyah": 83,
      "endAyah": 89
    }
  ],
  "14": [
    {
      "surah": 2,
      "startAyah": 90,
      "endAyah": 97
    }
  ],
  "15": [
    {
      "surah": 2,
      "startAyah": 98,
      "endAyah": 104
    }
  ],
  "16": [
    {
      "surah": 2,
      "startAyah": 105,
      "endAyah": 112
    }
  ],
  "17": [
    {
      "surah": 2,
      "startAyah": 113,
      "endAyah": 121
    }
  ],
  "18": [
    {
      "surah": 2,
      "startAyah": 122,
      "endAyah": 129
    }
  ],
  "19": [
    {
      "surah": 2,
      "startAyah": 130,
      "endAyah": 138
    }
  ],
  "20": [
    {
      "surah": 2,
      "startAyah": 139,
      "endAyah": 144
    }
  ],
  "21": [
    {
      "surah": 2,
      "startAyah": 145,
      "endAyah": 153
    }
  ],
  "22": [
    {
      "surah": 2,
      "startAyah": 154,
      "endAyah": 163
    }
  ],
  "23": [
    {
      "surah": 2,
      "startAyah": 164,
      "endAyah": 172
    }
  ],
  "24": [
    {
      "surah": 2,
      "startAyah": 173,
      "endAyah": 178
    }
  ],
  "25": [
    {
      "surah": 2,
      "startAyah": 179,
      "endAyah": 186
    }
  ],
  "26": [
    {
      "surah": 2,
      "startAyah": 187,
      "endAyah": 192
    }
  ],
  "27": [
    {
      "surah": 2,
      "startAyah": 193,
      "endAyah": 198
    }
  ],
  "28": [
    {
      "surah": 2,
      "startAyah": 199,
      "endAyah": 209
    }
  ],
  "29": [
    {
      "surah": 2,
      "startAyah": 210,
      "endAyah": 216
    }
  ],
  "30": [
    {
      "surah": 2,
      "startAyah": 217,
      "endAyah": 220
    }
  ],
  "31": [
    {
      "surah": 2,
      "startAyah": 221,
      "endAyah": 228
    }
  ],
  "32": [
    {
      "surah": 2,
      "startAyah": 229,
      "endAyah": 232
    }
  ],
  "33": [
    {
      "surah": 2,
      "startAyah": 233,
      "endAyah": 237
    }
  ],
  "34": [
    {
      "surah": 2,
      "startAyah": 238,
      "endAyah": 246
    }
  ],
  "35": [
    {
      "surah": 2,
      "startAyah": 247,
      "endAyah": 250
    }
  ],
  "36": [
    {
      "surah": 2,
      "startAyah": 251,
      "endAyah": 256
    }
  ],
  "37": [
    {
      "surah": 2,
      "startAyah": 257,
      "endAyah": 261
    }
  ],
  "38": [
    {
      "surah": 2,
      "startAyah": 262,
      "endAyah": 266
    }
  ],
  "39": [
    {
      "surah": 2,
      "startAyah": 267,
      "endAyah": 274
    }
  ],
  "40": [
    {
      "surah": 2,
      "startAyah": 275,
      "endAyah": 281
    }
  ],
  "41": [
    {
      "surah": 2,
      "startAyah": 282,
      "endAyah": 284
    }
  ],
  "42": [
    {
      "surah": 2,
      "startAyah": 285,
      "endAyah": 286
    },
    {
      "surah": 3,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "43": [
    {
      "surah": 3,
      "startAyah": 7,
      "endAyah": 13
    }
  ],
  "44": [
    {
      "surah": 3,
      "startAyah": 14,
      "endAyah": 22
    }
  ],
  "45": [
    {
      "surah": 3,
      "startAyah": 23,
      "endAyah": 30
    }
  ],
  "46": [
    {
      "surah": 3,
      "startAyah": 31,
      "endAyah": 40
    }
  ],
  "47": [
    {
      "surah": 3,
      "startAyah": 41,
      "endAyah": 49
    }
  ],
  "48": [
    {
      "surah": 3,
      "startAyah": 50,
      "endAyah": 60
    }
  ],
  "49": [
    {
      "surah": 3,
      "startAyah": 61,
      "endAyah": 71
    }
  ],
  "50": [
    {
      "surah": 3,
      "startAyah": 72,
      "endAyah": 79
    }
  ],
  "51": [
    {
      "surah": 3,
      "startAyah": 80,
      "endAyah": 88
    }
  ],
  "52": [
    {
      "surah": 3,
      "startAyah": 89,
      "endAyah": 98
    }
  ],
  "53": [
    {
      "surah": 3,
      "startAyah": 99,
      "endAyah": 108
    }
  ],
  "54": [
    {
      "surah": 3,
      "startAyah": 109,
      "endAyah": 116
    }
  ],
  "55": [
    {
      "surah": 3,
      "startAyah": 117,
      "endAyah": 125
    }
  ],
  "56": [
    {
      "surah": 3,
      "startAyah": 126,
      "endAyah": 138
    }
  ],
  "57": [
    {
      "surah": 3,
      "startAyah": 139,
      "endAyah": 148
    }
  ],
  "58": [
    {
      "surah": 3,
      "startAyah": 149,
      "endAyah": 153
    }
  ],
  "59": [
    {
      "surah": 3,
      "startAyah": 154,
      "endAyah": 162
    }
  ],
  "60": [
    {
      "surah": 3,
      "startAyah": 163,
      "endAyah": 171
    }
  ],
  "61": [
    {
      "surah": 3,
      "startAyah": 172,
      "endAyah": 180
    }
  ],
  "62": [
    {
      "surah": 3,
      "startAyah": 181,
      "endAyah": 188
    }
  ],
  "63": [
    {
      "surah": 3,
      "startAyah": 189,
      "endAyah": 197
    }
  ],
  "64": [
    {
      "surah": 3,
      "startAyah": 198,
      "endAyah": 200
    },
    {
      "surah": 4,
      "startAyah": 1,
      "endAyah": 3
    }
  ],
  "65": [
    {
      "surah": 4,
      "startAyah": 4,
      "endAyah": 10
    }
  ],
  "66": [
    {
      "surah": 4,
      "startAyah": 11,
      "endAyah": 15
    }
  ],
  "67": [
    {
      "surah": 4,
      "startAyah": 16,
      "endAyah": 22
    }
  ],
  "68": [
    {
      "surah": 4,
      "startAyah": 23,
      "endAyah": 26
    }
  ],
  "69": [
    {
      "surah": 4,
      "startAyah": 27,
      "endAyah": 34
    }
  ],
  "70": [
    {
      "surah": 4,
      "startAyah": 35,
      "endAyah": 42
    }
  ],
  "71": [
    {
      "surah": 4,
      "startAyah": 43,
      "endAyah": 50
    }
  ],
  "72": [
    {
      "surah": 4,
      "startAyah": 51,
      "endAyah": 59
    }
  ],
  "73": [
    {
      "surah": 4,
      "startAyah": 60,
      "endAyah": 68
    }
  ],
  "74": [
    {
      "surah": 4,
      "startAyah": 69,
      "endAyah": 76
    }
  ],
  "75": [
    {
      "surah": 4,
      "startAyah": 77,
      "endAyah": 83
    }
  ],
  "76": [
    {
      "surah": 4,
      "startAyah": 84,
      "endAyah": 90
    }
  ],
  "77": [
    {
      "surah": 4,
      "startAyah": 91,
      "endAyah": 94
    }
  ],
  "78": [
    {
      "surah": 4,
      "startAyah": 95,
      "endAyah": 101
    }
  ],
  "79": [
    {
      "surah": 4,
      "startAyah": 102,
      "endAyah": 110
    }
  ],
  "80": [
    {
      "surah": 4,
      "startAyah": 111,
      "endAyah": 119
    }
  ],
  "81": [
    {
      "surah": 4,
      "startAyah": 120,
      "endAyah": 128
    }
  ],
  "82": [
    {
      "surah": 4,
      "startAyah": 129,
      "endAyah": 136
    }
  ],
  "83": [
    {
      "surah": 4,
      "startAyah": 137,
      "endAyah": 144
    }
  ],
  "84": [
    {
      "surah": 4,
      "startAyah": 145,
      "endAyah": 153
    }
  ],
  "85": [
    {
      "surah": 4,
      "startAyah": 154,
      "endAyah": 162
    }
  ],
  "86": [
    {
      "surah": 4,
      "startAyah": 163,
      "endAyah": 171
    }
  ],
  "87": [
    {
      "surah": 4,
      "startAyah": 172,
      "endAyah": 176
    },
    {
      "surah": 5,
      "startAyah": 1,
      "endAyah": 1
    }
  ],
  "88": [
    {
      "surah": 5,
      "startAyah": 2,
      "endAyah": 4
    }
  ],
  "89": [
    {
      "surah": 5,
      "startAyah": 5,
      "endAyah": 10
    }
  ],
  "90": [
    {
      "surah": 5,
      "startAyah": 11,
      "endAyah": 15
    }
  ],
  "91": [
    {
      "surah": 5,
      "startAyah": 16,
      "endAyah": 22
    }
  ],
  "92": [
    {
      "surah": 5,
      "startAyah": 23,
      "endAyah": 31
    }
  ],
  "93": [
    {
      "surah": 5,
      "startAyah": 32,
      "endAyah": 40
    }
  ],
  "94": [
    {
      "surah": 5,
      "startAyah": 41,
      "endAyah": 45
    }
  ],
  "95": [
    {
      "surah": 5,
      "startAyah": 46,
      "endAyah": 51
    }
  ],
  "96": [
    {
      "surah": 5,
      "startAyah": 52,
      "endAyah": 59
    }
  ],
  "97": [
    {
      "surah": 5,
      "startAyah": 60,
      "endAyah": 66
    }
  ],
  "98": [
    {
      "surah": 5,
      "startAyah": 67,
      "endAyah": 74
    }
  ],
  "99": [
    {
      "surah": 5,
      "startAyah": 75,
      "endAyah": 82
    }
  ],
  "100": [
    {
      "surah": 5,
      "startAyah": 83,
      "endAyah": 91
    }
  ],
  "101": [
    {
      "surah": 5,
      "startAyah": 92,
      "endAyah": 98
    }
  ],
  "102": [
    {
      "surah": 5,
      "startAyah": 99,
      "endAyah": 105
    }
  ],
  "103": [
    {
      "surah": 5,
      "startAyah": 106,
      "endAyah": 112
    }
  ],
  "104": [
    {
      "surah": 5,
      "startAyah": 113,
      "endAyah": 120
    }
  ],
  "105": [
    {
      "surah": 6,
      "startAyah": 1,
      "endAyah": 8
    }
  ],
  "106": [
    {
      "surah": 6,
      "startAyah": 9,
      "endAyah": 19
    }
  ],
  "107": [
    {
      "surah": 6,
      "startAyah": 20,
      "endAyah": 30
    }
  ],
  "108": [
    {
      "surah": 6,
      "startAyah": 31,
      "endAyah": 39
    }
  ],
  "109": [
    {
      "surah": 6,
      "startAyah": 40,
      "endAyah": 50
    }
  ],
  "110": [
    {
      "surah": 6,
      "startAyah": 51,
      "endAyah": 58
    }
  ],
  "111": [
    {
      "surah": 6,
      "startAyah": 59,
      "endAyah": 69
    }
  ],
  "112": [
    {
      "surah": 6,
      "startAyah": 70,
      "endAyah": 77
    }
  ],
  "113": [
    {
      "surah": 6,
      "startAyah": 78,
      "endAyah": 88
    }
  ],
  "114": [
    {
      "surah": 6,
      "startAyah": 89,
      "endAyah": 93
    }
  ],
  "115": [
    {
      "surah": 6,
      "startAyah": 94,
      "endAyah": 102
    }
  ],
  "116": [
    {
      "surah": 6,
      "startAyah": 103,
      "endAyah": 112
    }
  ],
  "117": [
    {
      "surah": 6,
      "startAyah": 113,
      "endAyah": 121
    }
  ],
  "118": [
    {
      "surah": 6,
      "startAyah": 122,
      "endAyah": 129
    }
  ],
  "119": [
    {
      "surah": 6,
      "startAyah": 130,
      "endAyah": 138
    }
  ],
  "120": [
    {
      "surah": 6,
      "startAyah": 139,
      "endAyah": 144
    }
  ],
  "121": [
    {
      "surah": 6,
      "startAyah": 145,
      "endAyah": 151
    }
  ],
  "122": [
    {
      "surah": 6,
      "startAyah": 152,
      "endAyah": 158
    }
  ],
  "123": [
    {
      "surah": 6,
      "startAyah": 159,
      "endAyah": 165
    },
    {
      "surah": 7,
      "startAyah": 1,
      "endAyah": 2
    }
  ],
  "124": [
    {
      "surah": 7,
      "startAyah": 3,
      "endAyah": 17
    }
  ],
  "125": [
    {
      "surah": 7,
      "startAyah": 18,
      "endAyah": 27
    }
  ],
  "126": [
    {
      "surah": 7,
      "startAyah": 28,
      "endAyah": 36
    }
  ],
  "127": [
    {
      "surah": 7,
      "startAyah": 37,
      "endAyah": 42
    }
  ],
  "128": [
    {
      "surah": 7,
      "startAyah": 43,
      "endAyah": 51
    }
  ],
  "129": [
    {
      "surah": 7,
      "startAyah": 52,
      "endAyah": 59
    }
  ],
  "130": [
    {
      "surah": 7,
      "startAyah": 60,
      "endAyah": 70
    }
  ],
  "131": [
    {
      "surah": 7,
      "startAyah": 71,
      "endAyah": 80
    }
  ],
  "132": [
    {
      "surah": 7,
      "startAyah": 81,
      "endAyah": 88
    }
  ],
  "133": [
    {
      "surah": 7,
      "startAyah": 89,
      "endAyah": 100
    }
  ],
  "134": [
    {
      "surah": 7,
      "startAyah": 101,
      "endAyah": 116
    }
  ],
  "135": [
    {
      "surah": 7,
      "startAyah": 117,
      "endAyah": 130
    }
  ],
  "136": [
    {
      "surah": 7,
      "startAyah": 131,
      "endAyah": 139
    }
  ],
  "137": [
    {
      "surah": 7,
      "startAyah": 140,
      "endAyah": 145
    }
  ],
  "138": [
    {
      "surah": 7,
      "startAyah": 146,
      "endAyah": 154
    }
  ],
  "139": [
    {
      "surah": 7,
      "startAyah": 155,
      "endAyah": 159
    }
  ],
  "140": [
    {
      "surah": 7,
      "startAyah": 160,
      "endAyah": 166
    }
  ],
  "141": [
    {
      "surah": 7,
      "startAyah": 167,
      "endAyah": 175
    }
  ],
  "142": [
    {
      "surah": 7,
      "startAyah": 176,
      "endAyah": 185
    }
  ],
  "143": [
    {
      "surah": 7,
      "startAyah": 186,
      "endAyah": 194
    }
  ],
  "144": [
    {
      "surah": 7,
      "startAyah": 195,
      "endAyah": 206
    }
  ],
  "145": [
    {
      "surah": 8,
      "startAyah": 1,
      "endAyah": 10
    }
  ],
  "146": [
    {
      "surah": 8,
      "startAyah": 11,
      "endAyah": 20
    }
  ],
  "147": [
    {
      "surah": 8,
      "startAyah": 21,
      "endAyah": 31
    }
  ],
  "148": [
    {
      "surah": 8,
      "startAyah": 32,
      "endAyah": 40
    }
  ],
  "149": [
    {
      "surah": 8,
      "startAyah": 41,
      "endAyah": 47
    }
  ],
  "150": [
    {
      "surah": 8,
      "startAyah": 48,
      "endAyah": 58
    }
  ],
  "151": [
    {
      "surah": 8,
      "startAyah": 59,
      "endAyah": 66
    }
  ],
  "152": [
    {
      "surah": 8,
      "startAyah": 67,
      "endAyah": 74
    }
  ],
  "153": [
    {
      "surah": 8,
      "startAyah": 75,
      "endAyah": 75
    },
    {
      "surah": 9,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "154": [
    {
      "surah": 9,
      "startAyah": 7,
      "endAyah": 16
    }
  ],
  "155": [
    {
      "surah": 9,
      "startAyah": 17,
      "endAyah": 23
    }
  ],
  "156": [
    {
      "surah": 9,
      "startAyah": 24,
      "endAyah": 31
    }
  ],
  "157": [
    {
      "surah": 9,
      "startAyah": 32,
      "endAyah": 37
    }
  ],
  "158": [
    {
      "surah": 9,
      "startAyah": 38,
      "endAyah": 45
    }
  ],
  "159": [
    {
      "surah": 9,
      "startAyah": 46,
      "endAyah": 54
    }
  ],
  "160": [
    {
      "surah": 9,
      "startAyah": 55,
      "endAyah": 63
    }
  ],
  "161": [
    {
      "surah": 9,
      "startAyah": 64,
      "endAyah": 70
    }
  ],
  "162": [
    {
      "surah": 9,
      "startAyah": 71,
      "endAyah": 78
    }
  ],
  "163": [
    {
      "surah": 9,
      "startAyah": 79,
      "endAyah": 86
    }
  ],
  "164": [
    {
      "surah": 9,
      "startAyah": 87,
      "endAyah": 94
    }
  ],
  "165": [
    {
      "surah": 9,
      "startAyah": 95,
      "endAyah": 102
    }
  ],
  "166": [
    {
      "surah": 9,
      "startAyah": 103,
      "endAyah": 110
    }
  ],
  "167": [
    {
      "surah": 9,
      "startAyah": 111,
      "endAyah": 117
    }
  ],
  "168": [
    {
      "surah": 9,
      "startAyah": 118,
      "endAyah": 124
    }
  ],
  "169": [
    {
      "surah": 9,
      "startAyah": 125,
      "endAyah": 129
    },
    {
      "surah": 10,
      "startAyah": 1,
      "endAyah": 2
    }
  ],
  "170": [
    {
      "surah": 10,
      "startAyah": 3,
      "endAyah": 11
    }
  ],
  "171": [
    {
      "surah": 10,
      "startAyah": 12,
      "endAyah": 19
    }
  ],
  "172": [
    {
      "surah": 10,
      "startAyah": 20,
      "endAyah": 25
    }
  ],
  "173": [
    {
      "surah": 10,
      "startAyah": 26,
      "endAyah": 34
    }
  ],
  "174": [
    {
      "surah": 10,
      "startAyah": 35,
      "endAyah": 44
    }
  ],
  "175": [
    {
      "surah": 10,
      "startAyah": 45,
      "endAyah": 57
    }
  ],
  "176": [
    {
      "surah": 10,
      "startAyah": 58,
      "endAyah": 67
    }
  ],
  "177": [
    {
      "surah": 10,
      "startAyah": 68,
      "endAyah": 75
    }
  ],
  "178": [
    {
      "surah": 10,
      "startAyah": 76,
      "endAyah": 87
    }
  ],
  "179": [
    {
      "surah": 10,
      "startAyah": 88,
      "endAyah": 97
    }
  ],
  "180": [
    {
      "surah": 10,
      "startAyah": 98,
      "endAyah": 107
    }
  ],
  "181": [
    {
      "surah": 10,
      "startAyah": 108,
      "endAyah": 109
    },
    {
      "surah": 11,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "182": [
    {
      "surah": 11,
      "startAyah": 7,
      "endAyah": 16
    }
  ],
  "183": [
    {
      "surah": 11,
      "startAyah": 17,
      "endAyah": 25
    }
  ],
  "184": [
    {
      "surah": 11,
      "startAyah": 26,
      "endAyah": 35
    }
  ],
  "185": [
    {
      "surah": 11,
      "startAyah": 36,
      "endAyah": 44
    }
  ],
  "186": [
    {
      "surah": 11,
      "startAyah": 45,
      "endAyah": 55
    }
  ],
  "187": [
    {
      "surah": 11,
      "startAyah": 56,
      "endAyah": 64
    }
  ],
  "188": [
    {
      "surah": 11,
      "startAyah": 65,
      "endAyah": 76
    }
  ],
  "189": [
    {
      "surah": 11,
      "startAyah": 77,
      "endAyah": 86
    }
  ],
  "190": [
    {
      "surah": 11,
      "startAyah": 87,
      "endAyah": 95
    }
  ],
  "191": [
    {
      "surah": 11,
      "startAyah": 96,
      "endAyah": 108
    }
  ],
  "192": [
    {
      "surah": 11,
      "startAyah": 109,
      "endAyah": 119
    }
  ],
  "193": [
    {
      "surah": 11,
      "startAyah": 120,
      "endAyah": 123
    },
    {
      "surah": 12,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "194": [
    {
      "surah": 12,
      "startAyah": 6,
      "endAyah": 17
    }
  ],
  "195": [
    {
      "surah": 12,
      "startAyah": 18,
      "endAyah": 25
    }
  ],
  "196": [
    {
      "surah": 12,
      "startAyah": 26,
      "endAyah": 35
    }
  ],
  "197": [
    {
      "surah": 12,
      "startAyah": 36,
      "endAyah": 42
    }
  ],
  "198": [
    {
      "surah": 12,
      "startAyah": 43,
      "endAyah": 51
    }
  ],
  "199": [
    {
      "surah": 12,
      "startAyah": 52,
      "endAyah": 63
    }
  ],
  "200": [
    {
      "surah": 12,
      "startAyah": 64,
      "endAyah": 72
    }
  ],
  "201": [
    {
      "surah": 12,
      "startAyah": 73,
      "endAyah": 81
    }
  ],
  "202": [
    {
      "surah": 12,
      "startAyah": 82,
      "endAyah": 92
    }
  ],
  "203": [
    {
      "surah": 12,
      "startAyah": 93,
      "endAyah": 102
    }
  ],
  "204": [
    {
      "surah": 12,
      "startAyah": 103,
      "endAyah": 111
    }
  ],
  "205": [
    {
      "surah": 13,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "206": [
    {
      "surah": 13,
      "startAyah": 7,
      "endAyah": 15
    }
  ],
  "207": [
    {
      "surah": 13,
      "startAyah": 16,
      "endAyah": 22
    }
  ],
  "208": [
    {
      "surah": 13,
      "startAyah": 23,
      "endAyah": 30
    }
  ],
  "209": [
    {
      "surah": 13,
      "startAyah": 31,
      "endAyah": 38
    }
  ],
  "210": [
    {
      "surah": 13,
      "startAyah": 39,
      "endAyah": 43
    },
    {
      "surah": 14,
      "startAyah": 1,
      "endAyah": 3
    }
  ],
  "211": [
    {
      "surah": 14,
      "startAyah": 4,
      "endAyah": 9
    }
  ],
  "212": [
    {
      "surah": 14,
      "startAyah": 10,
      "endAyah": 20
    }
  ],
  "213": [
    {
      "surah": 14,
      "startAyah": 21,
      "endAyah": 27
    }
  ],
  "214": [
    {
      "surah": 14,
      "startAyah": 28,
      "endAyah": 38
    }
  ],
  "215": [
    {
      "surah": 14,
      "startAyah": 39,
      "endAyah": 50
    }
  ],
  "216": [
    {
      "surah": 14,
      "startAyah": 51,
      "endAyah": 52
    },
    {
      "surah": 15,
      "startAyah": 1,
      "endAyah": 13
    }
  ],
  "217": [
    {
      "surah": 15,
      "startAyah": 14,
      "endAyah": 31
    }
  ],
  "218": [
    {
      "surah": 15,
      "startAyah": 32,
      "endAyah": 53
    }
  ],
  "219": [
    {
      "surah": 15,
      "startAyah": 54,
      "endAyah": 76
    }
  ],
  "220": [
    {
      "surah": 15,
      "startAyah": 77,
      "endAyah": 99
    }
  ],
  "221": [
    {
      "surah": 16,
      "startAyah": 1,
      "endAyah": 11
    }
  ],
  "222": [
    {
      "surah": 16,
      "startAyah": 12,
      "endAyah": 24
    }
  ],
  "223": [
    {
      "surah": 16,
      "startAyah": 25,
      "endAyah": 33
    }
  ],
  "224": [
    {
      "surah": 16,
      "startAyah": 34,
      "endAyah": 43
    }
  ],
  "225": [
    {
      "surah": 16,
      "startAyah": 44,
      "endAyah": 57
    }
  ],
  "226": [
    {
      "surah": 16,
      "startAyah": 58,
      "endAyah": 67
    }
  ],
  "227": [
    {
      "surah": 16,
      "startAyah": 68,
      "endAyah": 75
    }
  ],
  "228": [
    {
      "surah": 16,
      "startAyah": 76,
      "endAyah": 84
    }
  ],
  "229": [
    {
      "surah": 16,
      "startAyah": 85,
      "endAyah": 92
    }
  ],
  "230": [
    {
      "surah": 16,
      "startAyah": 93,
      "endAyah": 103
    }
  ],
  "231": [
    {
      "surah": 16,
      "startAyah": 104,
      "endAyah": 114
    }
  ],
  "232": [
    {
      "surah": 16,
      "startAyah": 115,
      "endAyah": 125
    }
  ],
  "233": [
    {
      "surah": 16,
      "startAyah": 126,
      "endAyah": 128
    },
    {
      "surah": 17,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "234": [
    {
      "surah": 17,
      "startAyah": 7,
      "endAyah": 16
    }
  ],
  "235": [
    {
      "surah": 17,
      "startAyah": 17,
      "endAyah": 27
    }
  ],
  "236": [
    {
      "surah": 17,
      "startAyah": 28,
      "endAyah": 39
    }
  ],
  "237": [
    {
      "surah": 17,
      "startAyah": 40,
      "endAyah": 51
    }
  ],
  "238": [
    {
      "surah": 17,
      "startAyah": 52,
      "endAyah": 60
    }
  ],
  "239": [
    {
      "surah": 17,
      "startAyah": 61,
      "endAyah": 70
    }
  ],
  "240": [
    {
      "surah": 17,
      "startAyah": 71,
      "endAyah": 82
    }
  ],
  "241": [
    {
      "surah": 17,
      "startAyah": 83,
      "endAyah": 95
    }
  ],
  "242": [
    {
      "surah": 17,
      "startAyah": 96,
      "endAyah": 105
    }
  ],
  "243": [
    {
      "surah": 17,
      "startAyah": 106,
      "endAyah": 111
    },
    {
      "surah": 18,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "244": [
    {
      "surah": 18,
      "startAyah": 6,
      "endAyah": 16
    }
  ],
  "245": [
    {
      "surah": 18,
      "startAyah": 17,
      "endAyah": 23
    }
  ],
  "246": [
    {
      "surah": 18,
      "startAyah": 24,
      "endAyah": 31
    }
  ],
  "247": [
    {
      "surah": 18,
      "startAyah": 32,
      "endAyah": 43
    }
  ],
  "248": [
    {
      "surah": 18,
      "startAyah": 44,
      "endAyah": 52
    }
  ],
  "249": [
    {
      "surah": 18,
      "startAyah": 53,
      "endAyah": 61
    }
  ],
  "250": [
    {
      "surah": 18,
      "startAyah": 62,
      "endAyah": 76
    }
  ],
  "251": [
    {
      "surah": 18,
      "startAyah": 77,
      "endAyah": 87
    }
  ],
  "252": [
    {
      "surah": 18,
      "startAyah": 88,
      "endAyah": 101
    }
  ],
  "253": [
    {
      "surah": 18,
      "startAyah": 102,
      "endAyah": 110
    },
    {
      "surah": 19,
      "startAyah": 1,
      "endAyah": 3
    }
  ],
  "254": [
    {
      "surah": 19,
      "startAyah": 4,
      "endAyah": 19
    }
  ],
  "255": [
    {
      "surah": 19,
      "startAyah": 20,
      "endAyah": 34
    }
  ],
  "256": [
    {
      "surah": 19,
      "startAyah": 35,
      "endAyah": 48
    }
  ],
  "257": [
    {
      "surah": 19,
      "startAyah": 49,
      "endAyah": 62
    }
  ],
  "258": [
    {
      "surah": 19,
      "startAyah": 63,
      "endAyah": 75
    }
  ],
  "259": [
    {
      "surah": 19,
      "startAyah": 76,
      "endAyah": 97
    }
  ],
  "260": [
    {
      "surah": 19,
      "startAyah": 98,
      "endAyah": 98
    },
    {
      "surah": 20,
      "startAyah": 1,
      "endAyah": 16
    }
  ],
  "261": [
    {
      "surah": 20,
      "startAyah": 17,
      "endAyah": 39
    }
  ],
  "262": [
    {
      "surah": 20,
      "startAyah": 40,
      "endAyah": 57
    }
  ],
  "263": [
    {
      "surah": 20,
      "startAyah": 58,
      "endAyah": 71
    }
  ],
  "264": [
    {
      "surah": 20,
      "startAyah": 72,
      "endAyah": 85
    }
  ],
  "265": [
    {
      "surah": 20,
      "startAyah": 86,
      "endAyah": 96
    }
  ],
  "266": [
    {
      "surah": 20,
      "startAyah": 97,
      "endAyah": 113
    }
  ],
  "267": [
    {
      "surah": 20,
      "startAyah": 114,
      "endAyah": 127
    }
  ],
  "268": [
    {
      "surah": 20,
      "startAyah": 128,
      "endAyah": 135
    },
    {
      "surah": 21,
      "startAyah": 1,
      "endAyah": 1
    }
  ],
  "269": [
    {
      "surah": 21,
      "startAyah": 2,
      "endAyah": 16
    }
  ],
  "270": [
    {
      "surah": 21,
      "startAyah": 17,
      "endAyah": 30
    }
  ],
  "271": [
    {
      "surah": 21,
      "startAyah": 31,
      "endAyah": 43
    }
  ],
  "272": [
    {
      "surah": 21,
      "startAyah": 44,
      "endAyah": 58
    }
  ],
  "273": [
    {
      "surah": 21,
      "startAyah": 59,
      "endAyah": 74
    }
  ],
  "274": [
    {
      "surah": 21,
      "startAyah": 75,
      "endAyah": 86
    }
  ],
  "275": [
    {
      "surah": 21,
      "startAyah": 87,
      "endAyah": 101
    }
  ],
  "276": [
    {
      "surah": 21,
      "startAyah": 102,
      "endAyah": 112
    },
    {
      "surah": 22,
      "startAyah": 1,
      "endAyah": 1
    }
  ],
  "277": [
    {
      "surah": 22,
      "startAyah": 2,
      "endAyah": 10
    }
  ],
  "278": [
    {
      "surah": 22,
      "startAyah": 11,
      "endAyah": 19
    }
  ],
  "279": [
    {
      "surah": 22,
      "startAyah": 20,
      "endAyah": 29
    }
  ],
  "280": [
    {
      "surah": 22,
      "startAyah": 30,
      "endAyah": 39
    }
  ],
  "281": [
    {
      "surah": 22,
      "startAyah": 40,
      "endAyah": 50
    }
  ],
  "282": [
    {
      "surah": 22,
      "startAyah": 51,
      "endAyah": 61
    }
  ],
  "283": [
    {
      "surah": 22,
      "startAyah": 62,
      "endAyah": 72
    }
  ],
  "284": [
    {
      "surah": 22,
      "startAyah": 73,
      "endAyah": 78
    },
    {
      "surah": 23,
      "startAyah": 1,
      "endAyah": 4
    }
  ],
  "285": [
    {
      "surah": 23,
      "startAyah": 5,
      "endAyah": 21
    }
  ],
  "286": [
    {
      "surah": 23,
      "startAyah": 22,
      "endAyah": 33
    }
  ],
  "287": [
    {
      "surah": 23,
      "startAyah": 34,
      "endAyah": 50
    }
  ],
  "288": [
    {
      "surah": 23,
      "startAyah": 51,
      "endAyah": 70
    }
  ],
  "289": [
    {
      "surah": 23,
      "startAyah": 71,
      "endAyah": 87
    }
  ],
  "290": [
    {
      "surah": 23,
      "startAyah": 88,
      "endAyah": 105
    }
  ],
  "291": [
    {
      "surah": 23,
      "startAyah": 106,
      "endAyah": 118
    },
    {
      "surah": 24,
      "startAyah": 1,
      "endAyah": 1
    }
  ],
  "292": [
    {
      "surah": 24,
      "startAyah": 2,
      "endAyah": 11
    }
  ],
  "293": [
    {
      "surah": 24,
      "startAyah": 12,
      "endAyah": 21
    }
  ],
  "294": [
    {
      "surah": 24,
      "startAyah": 22,
      "endAyah": 30
    }
  ],
  "295": [
    {
      "surah": 24,
      "startAyah": 31,
      "endAyah": 34
    }
  ],
  "296": [
    {
      "surah": 24,
      "startAyah": 35,
      "endAyah": 42
    }
  ],
  "297": [
    {
      "surah": 24,
      "startAyah": 43,
      "endAyah": 52
    }
  ],
  "298": [
    {
      "surah": 24,
      "startAyah": 53,
      "endAyah": 58
    }
  ],
  "299": [
    {
      "surah": 24,
      "startAyah": 59,
      "endAyah": 62
    }
  ],
  "300": [
    {
      "surah": 24,
      "startAyah": 63,
      "endAyah": 64
    },
    {
      "surah": 25,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "301": [
    {
      "surah": 25,
      "startAyah": 6,
      "endAyah": 17
    }
  ],
  "302": [
    {
      "surah": 25,
      "startAyah": 18,
      "endAyah": 31
    }
  ],
  "303": [
    {
      "surah": 25,
      "startAyah": 32,
      "endAyah": 44
    }
  ],
  "304": [
    {
      "surah": 25,
      "startAyah": 45,
      "endAyah": 58
    }
  ],
  "305": [
    {
      "surah": 25,
      "startAyah": 59,
      "endAyah": 72
    }
  ],
  "306": [
    {
      "surah": 25,
      "startAyah": 73,
      "endAyah": 77
    },
    {
      "surah": 26,
      "startAyah": 1,
      "endAyah": 11
    }
  ],
  "307": [
    {
      "surah": 26,
      "startAyah": 12,
      "endAyah": 33
    }
  ],
  "308": [
    {
      "surah": 26,
      "startAyah": 34,
      "endAyah": 55
    }
  ],
  "309": [
    {
      "surah": 26,
      "startAyah": 56,
      "endAyah": 82
    }
  ],
  "310": [
    {
      "surah": 26,
      "startAyah": 83,
      "endAyah": 111
    }
  ],
  "311": [
    {
      "surah": 26,
      "startAyah": 112,
      "endAyah": 138
    }
  ],
  "312": [
    {
      "surah": 26,
      "startAyah": 139,
      "endAyah": 164
    }
  ],
  "313": [
    {
      "surah": 26,
      "startAyah": 165,
      "endAyah": 189
    }
  ],
  "314": [
    {
      "surah": 26,
      "startAyah": 190,
      "endAyah": 216
    }
  ],
  "315": [
    {
      "surah": 26,
      "startAyah": 217,
      "endAyah": 227
    },
    {
      "surah": 27,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "316": [
    {
      "surah": 27,
      "startAyah": 7,
      "endAyah": 17
    }
  ],
  "317": [
    {
      "surah": 27,
      "startAyah": 18,
      "endAyah": 31
    }
  ],
  "318": [
    {
      "surah": 27,
      "startAyah": 32,
      "endAyah": 41
    }
  ],
  "319": [
    {
      "surah": 27,
      "startAyah": 42,
      "endAyah": 54
    }
  ],
  "320": [
    {
      "surah": 27,
      "startAyah": 55,
      "endAyah": 64
    }
  ],
  "321": [
    {
      "surah": 27,
      "startAyah": 65,
      "endAyah": 81
    }
  ],
  "322": [
    {
      "surah": 27,
      "startAyah": 82,
      "endAyah": 93
    }
  ],
  "323": [
    {
      "surah": 28,
      "startAyah": 1,
      "endAyah": 9
    }
  ],
  "324": [
    {
      "surah": 28,
      "startAyah": 10,
      "endAyah": 18
    }
  ],
  "325": [
    {
      "surah": 28,
      "startAyah": 19,
      "endAyah": 28
    }
  ],
  "326": [
    {
      "surah": 28,
      "startAyah": 29,
      "endAyah": 37
    }
  ],
  "327": [
    {
      "surah": 28,
      "startAyah": 38,
      "endAyah": 46
    }
  ],
  "328": [
    {
      "surah": 28,
      "startAyah": 47,
      "endAyah": 57
    }
  ],
  "329": [
    {
      "surah": 28,
      "startAyah": 58,
      "endAyah": 69
    }
  ],
  "330": [
    {
      "surah": 28,
      "startAyah": 70,
      "endAyah": 78
    }
  ],
  "331": [
    {
      "surah": 28,
      "startAyah": 79,
      "endAyah": 88
    }
  ],
  "332": [
    {
      "surah": 29,
      "startAyah": 1,
      "endAyah": 10
    }
  ],
  "333": [
    {
      "surah": 29,
      "startAyah": 11,
      "endAyah": 21
    }
  ],
  "334": [
    {
      "surah": 29,
      "startAyah": 22,
      "endAyah": 31
    }
  ],
  "335": [
    {
      "surah": 29,
      "startAyah": 32,
      "endAyah": 41
    }
  ],
  "336": [
    {
      "surah": 29,
      "startAyah": 42,
      "endAyah": 51
    }
  ],
  "337": [
    {
      "surah": 29,
      "startAyah": 52,
      "endAyah": 63
    }
  ],
  "338": [
    {
      "surah": 29,
      "startAyah": 64,
      "endAyah": 69
    },
    {
      "surah": 30,
      "startAyah": 1,
      "endAyah": 7
    }
  ],
  "339": [
    {
      "surah": 30,
      "startAyah": 8,
      "endAyah": 19
    }
  ],
  "340": [
    {
      "surah": 30,
      "startAyah": 20,
      "endAyah": 28
    }
  ],
  "341": [
    {
      "surah": 30,
      "startAyah": 29,
      "endAyah": 39
    }
  ],
  "342": [
    {
      "surah": 30,
      "startAyah": 40,
      "endAyah": 49
    }
  ],
  "343": [
    {
      "surah": 30,
      "startAyah": 50,
      "endAyah": 60
    }
  ],
  "344": [
    {
      "surah": 31,
      "startAyah": 1,
      "endAyah": 13
    }
  ],
  "345": [
    {
      "surah": 31,
      "startAyah": 14,
      "endAyah": 21
    }
  ],
  "346": [
    {
      "surah": 31,
      "startAyah": 22,
      "endAyah": 32
    }
  ],
  "347": [
    {
      "surah": 31,
      "startAyah": 33,
      "endAyah": 34
    },
    {
      "surah": 32,
      "startAyah": 1,
      "endAyah": 7
    }
  ],
  "348": [
    {
      "surah": 32,
      "startAyah": 8,
      "endAyah": 19
    }
  ],
  "349": [
    {
      "surah": 32,
      "startAyah": 20,
      "endAyah": 30
    }
  ],
  "350": [
    {
      "surah": 33,
      "startAyah": 1,
      "endAyah": 8
    }
  ],
  "351": [
    {
      "surah": 33,
      "startAyah": 9,
      "endAyah": 18
    }
  ],
  "352": [
    {
      "surah": 33,
      "startAyah": 19,
      "endAyah": 26
    }
  ],
  "353": [
    {
      "surah": 33,
      "startAyah": 27,
      "endAyah": 34
    }
  ],
  "354": [
    {
      "surah": 33,
      "startAyah": 35,
      "endAyah": 42
    }
  ],
  "355": [
    {
      "surah": 33,
      "startAyah": 43,
      "endAyah": 50
    }
  ],
  "356": [
    {
      "surah": 33,
      "startAyah": 51,
      "endAyah": 56
    }
  ],
  "357": [
    {
      "surah": 33,
      "startAyah": 57,
      "endAyah": 68
    }
  ],
  "358": [
    {
      "surah": 33,
      "startAyah": 69,
      "endAyah": 73
    },
    {
      "surah": 34,
      "startAyah": 1,
      "endAyah": 2
    }
  ],
  "359": [
    {
      "surah": 34,
      "startAyah": 3,
      "endAyah": 12
    }
  ],
  "360": [
    {
      "surah": 34,
      "startAyah": 13,
      "endAyah": 21
    }
  ],
  "361": [
    {
      "surah": 34,
      "startAyah": 22,
      "endAyah": 32
    }
  ],
  "362": [
    {
      "surah": 34,
      "startAyah": 33,
      "endAyah": 42
    }
  ],
  "363": [
    {
      "surah": 34,
      "startAyah": 43,
      "endAyah": 54
    }
  ],
  "364": [
    {
      "surah": 35,
      "startAyah": 1,
      "endAyah": 7
    }
  ],
  "365": [
    {
      "surah": 35,
      "startAyah": 8,
      "endAyah": 13
    }
  ],
  "366": [
    {
      "surah": 35,
      "startAyah": 14,
      "endAyah": 27
    }
  ],
  "367": [
    {
      "surah": 35,
      "startAyah": 28,
      "endAyah": 38
    }
  ],
  "368": [
    {
      "surah": 35,
      "startAyah": 39,
      "endAyah": 45
    }
  ],
  "369": [
    {
      "surah": 36,
      "startAyah": 1,
      "endAyah": 14
    }
  ],
  "370": [
    {
      "surah": 36,
      "startAyah": 15,
      "endAyah": 33
    }
  ],
  "371": [
    {
      "surah": 36,
      "startAyah": 34,
      "endAyah": 48
    }
  ],
  "372": [
    {
      "surah": 36,
      "startAyah": 49,
      "endAyah": 66
    }
  ],
  "373": [
    {
      "surah": 36,
      "startAyah": 67,
      "endAyah": 83
    }
  ],
  "374": [
    {
      "surah": 37,
      "startAyah": 1,
      "endAyah": 21
    }
  ],
  "375": [
    {
      "surah": 37,
      "startAyah": 22,
      "endAyah": 50
    }
  ],
  "376": [
    {
      "surah": 37,
      "startAyah": 51,
      "endAyah": 80
    }
  ],
  "377": [
    {
      "surah": 37,
      "startAyah": 81,
      "endAyah": 109
    }
  ],
  "378": [
    {
      "surah": 37,
      "startAyah": 110,
      "endAyah": 140
    }
  ],
  "379": [
    {
      "surah": 37,
      "startAyah": 141,
      "endAyah": 171
    }
  ],
  "380": [
    {
      "surah": 37,
      "startAyah": 172,
      "endAyah": 182
    },
    {
      "surah": 38,
      "startAyah": 1,
      "endAyah": 8
    }
  ],
  "381": [
    {
      "surah": 38,
      "startAyah": 9,
      "endAyah": 23
    }
  ],
  "382": [
    {
      "surah": 38,
      "startAyah": 24,
      "endAyah": 37
    }
  ],
  "383": [
    {
      "surah": 38,
      "startAyah": 38,
      "endAyah": 58
    }
  ],
  "384": [
    {
      "surah": 38,
      "startAyah": 59,
      "endAyah": 78
    }
  ],
  "385": [
    {
      "surah": 38,
      "startAyah": 79,
      "endAyah": 88
    },
    {
      "surah": 39,
      "startAyah": 1,
      "endAyah": 4
    }
  ],
  "386": [
    {
      "surah": 39,
      "startAyah": 5,
      "endAyah": 12
    }
  ],
  "387": [
    {
      "surah": 39,
      "startAyah": 13,
      "endAyah": 22
    }
  ],
  "388": [
    {
      "surah": 39,
      "startAyah": 23,
      "endAyah": 36
    }
  ],
  "389": [
    {
      "surah": 39,
      "startAyah": 37,
      "endAyah": 45
    }
  ],
  "390": [
    {
      "surah": 39,
      "startAyah": 46,
      "endAyah": 57
    }
  ],
  "391": [
    {
      "surah": 39,
      "startAyah": 58,
      "endAyah": 70
    }
  ],
  "392": [
    {
      "surah": 39,
      "startAyah": 71,
      "endAyah": 75
    },
    {
      "surah": 40,
      "startAyah": 1,
      "endAyah": 3
    }
  ],
  "393": [
    {
      "surah": 40,
      "startAyah": 4,
      "endAyah": 12
    }
  ],
  "394": [
    {
      "surah": 40,
      "startAyah": 13,
      "endAyah": 24
    }
  ],
  "395": [
    {
      "surah": 40,
      "startAyah": 25,
      "endAyah": 33
    }
  ],
  "396": [
    {
      "surah": 40,
      "startAyah": 34,
      "endAyah": 44
    }
  ],
  "397": [
    {
      "surah": 40,
      "startAyah": 45,
      "endAyah": 56
    }
  ],
  "398": [
    {
      "surah": 40,
      "startAyah": 57,
      "endAyah": 66
    }
  ],
  "399": [
    {
      "surah": 40,
      "startAyah": 67,
      "endAyah": 80
    }
  ],
  "400": [
    {
      "surah": 40,
      "startAyah": 81,
      "endAyah": 85
    },
    {
      "surah": 41,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "401": [
    {
      "surah": 41,
      "startAyah": 6,
      "endAyah": 15
    }
  ],
  "402": [
    {
      "surah": 41,
      "startAyah": 16,
      "endAyah": 27
    }
  ],
  "403": [
    {
      "surah": 41,
      "startAyah": 28,
      "endAyah": 38
    }
  ],
  "404": [
    {
      "surah": 41,
      "startAyah": 39,
      "endAyah": 46
    }
  ],
  "405": [
    {
      "surah": 41,
      "startAyah": 47,
      "endAyah": 54
    },
    {
      "surah": 42,
      "startAyah": 1,
      "endAyah": 2
    }
  ],
  "406": [
    {
      "surah": 42,
      "startAyah": 3,
      "endAyah": 12
    }
  ],
  "407": [
    {
      "surah": 42,
      "startAyah": 13,
      "endAyah": 19
    }
  ],
  "408": [
    {
      "surah": 42,
      "startAyah": 20,
      "endAyah": 28
    }
  ],
  "409": [
    {
      "surah": 42,
      "startAyah": 29,
      "endAyah": 41
    }
  ],
  "410": [
    {
      "surah": 42,
      "startAyah": 42,
      "endAyah": 50
    }
  ],
  "411": [
    {
      "surah": 42,
      "startAyah": 51,
      "endAyah": 53
    },
    {
      "surah": 43,
      "startAyah": 1,
      "endAyah": 11
    }
  ],
  "412": [
    {
      "surah": 43,
      "startAyah": 12,
      "endAyah": 24
    }
  ],
  "413": [
    {
      "surah": 43,
      "startAyah": 25,
      "endAyah": 38
    }
  ],
  "414": [
    {
      "surah": 43,
      "startAyah": 39,
      "endAyah": 54
    }
  ],
  "415": [
    {
      "surah": 43,
      "startAyah": 55,
      "endAyah": 70
    }
  ],
  "416": [
    {
      "surah": 43,
      "startAyah": 71,
      "endAyah": 89
    }
  ],
  "417": [
    {
      "surah": 44,
      "startAyah": 1,
      "endAyah": 19
    }
  ],
  "418": [
    {
      "surah": 44,
      "startAyah": 20,
      "endAyah": 44
    }
  ],
  "419": [
    {
      "surah": 44,
      "startAyah": 45,
      "endAyah": 59
    },
    {
      "surah": 45,
      "startAyah": 1,
      "endAyah": 4
    }
  ],
  "420": [
    {
      "surah": 45,
      "startAyah": 5,
      "endAyah": 16
    }
  ],
  "421": [
    {
      "surah": 45,
      "startAyah": 17,
      "endAyah": 26
    }
  ],
  "422": [
    {
      "surah": 45,
      "startAyah": 27,
      "endAyah": 37
    }
  ],
  "423": [
    {
      "surah": 46,
      "startAyah": 1,
      "endAyah": 10
    }
  ],
  "424": [
    {
      "surah": 46,
      "startAyah": 11,
      "endAyah": 17
    }
  ],
  "425": [
    {
      "surah": 46,
      "startAyah": 18,
      "endAyah": 26
    }
  ],
  "426": [
    {
      "surah": 46,
      "startAyah": 27,
      "endAyah": 35
    }
  ],
  "427": [
    {
      "surah": 47,
      "startAyah": 1,
      "endAyah": 9
    }
  ],
  "428": [
    {
      "surah": 47,
      "startAyah": 10,
      "endAyah": 17
    }
  ],
  "429": [
    {
      "surah": 47,
      "startAyah": 18,
      "endAyah": 30
    }
  ],
  "430": [
    {
      "surah": 47,
      "startAyah": 31,
      "endAyah": 38
    },
    {
      "surah": 48,
      "startAyah": 1,
      "endAyah": 1
    }
  ],
  "431": [
    {
      "surah": 48,
      "startAyah": 2,
      "endAyah": 10
    }
  ],
  "432": [
    {
      "surah": 48,
      "startAyah": 11,
      "endAyah": 17
    }
  ],
  "433": [
    {
      "surah": 48,
      "startAyah": 18,
      "endAyah": 26
    }
  ],
  "434": [
    {
      "surah": 48,
      "startAyah": 27,
      "endAyah": 29
    },
    {
      "surah": 49,
      "startAyah": 1,
      "endAyah": 1
    }
  ],
  "435": [
    {
      "surah": 49,
      "startAyah": 2,
      "endAyah": 10
    }
  ],
  "436": [
    {
      "surah": 49,
      "startAyah": 11,
      "endAyah": 16
    }
  ],
  "437": [
    {
      "surah": 49,
      "startAyah": 17,
      "endAyah": 18
    },
    {
      "surah": 50,
      "startAyah": 1,
      "endAyah": 13
    }
  ],
  "438": [
    {
      "surah": 50,
      "startAyah": 14,
      "endAyah": 33
    }
  ],
  "439": [
    {
      "surah": 50,
      "startAyah": 34,
      "endAyah": 45
    },
    {
      "surah": 51,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "440": [
    {
      "surah": 51,
      "startAyah": 7,
      "endAyah": 32
    }
  ],
  "441": [
    {
      "surah": 51,
      "startAyah": 33,
      "endAyah": 53
    }
  ],
  "442": [
    {
      "surah": 51,
      "startAyah": 54,
      "endAyah": 60
    },
    {
      "surah": 52,
      "startAyah": 1,
      "endAyah": 16
    }
  ],
  "443": [
    {
      "surah": 52,
      "startAyah": 17,
      "endAyah": 36
    }
  ],
  "444": [
    {
      "surah": 52,
      "startAyah": 37,
      "endAyah": 49
    },
    {
      "surah": 53,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "445": [
    {
      "surah": 53,
      "startAyah": 6,
      "endAyah": 29
    }
  ],
  "446": [
    {
      "surah": 53,
      "startAyah": 30,
      "endAyah": 55
    }
  ],
  "447": [
    {
      "surah": 53,
      "startAyah": 56,
      "endAyah": 62
    },
    {
      "surah": 54,
      "startAyah": 1,
      "endAyah": 13
    }
  ],
  "448": [
    {
      "surah": 54,
      "startAyah": 14,
      "endAyah": 36
    }
  ],
  "449": [
    {
      "surah": 54,
      "startAyah": 37,
      "endAyah": 55
    },
    {
      "surah": 55,
      "startAyah": 1,
      "endAyah": 4
    }
  ],
  "450": [
    {
      "surah": 55,
      "startAyah": 5,
      "endAyah": 32
    }
  ],
  "451": [
    {
      "surah": 55,
      "startAyah": 33,
      "endAyah": 60
    }
  ],
  "452": [
    {
      "surah": 55,
      "startAyah": 61,
      "endAyah": 78
    },
    {
      "surah": 56,
      "startAyah": 1,
      "endAyah": 8
    }
  ],
  "453": [
    {
      "surah": 56,
      "startAyah": 9,
      "endAyah": 46
    }
  ],
  "454": [
    {
      "surah": 56,
      "startAyah": 47,
      "endAyah": 74
    }
  ],
  "455": [
    {
      "surah": 56,
      "startAyah": 75,
      "endAyah": 96
    },
    {
      "surah": 57,
      "startAyah": 1,
      "endAyah": 2
    }
  ],
  "456": [
    {
      "surah": 57,
      "startAyah": 3,
      "endAyah": 11
    }
  ],
  "457": [
    {
      "surah": 57,
      "startAyah": 12,
      "endAyah": 18
    }
  ],
  "458": [
    {
      "surah": 57,
      "startAyah": 19,
      "endAyah": 25
    }
  ],
  "459": [
    {
      "surah": 57,
      "startAyah": 26,
      "endAyah": 29
    },
    {
      "surah": 58,
      "startAyah": 1,
      "endAyah": 2
    }
  ],
  "460": [
    {
      "surah": 58,
      "startAyah": 3,
      "endAyah": 8
    }
  ],
  "461": [
    {
      "surah": 58,
      "startAyah": 9,
      "endAyah": 18
    }
  ],
  "462": [
    {
      "surah": 58,
      "startAyah": 19,
      "endAyah": 22
    },
    {
      "surah": 59,
      "startAyah": 1,
      "endAyah": 1
    }
  ],
  "463": [
    {
      "surah": 59,
      "startAyah": 2,
      "endAyah": 9
    }
  ],
  "464": [
    {
      "surah": 59,
      "startAyah": 10,
      "endAyah": 18
    }
  ],
  "465": [
    {
      "surah": 59,
      "startAyah": 19,
      "endAyah": 24
    }
  ],
  "466": [
    {
      "surah": 60,
      "startAyah": 1,
      "endAyah": 8
    }
  ],
  "467": [
    {
      "surah": 60,
      "startAyah": 9,
      "endAyah": 13
    }
  ],
  "468": [
    {
      "surah": 61,
      "startAyah": 1,
      "endAyah": 9
    }
  ],
  "469": [
    {
      "surah": 61,
      "startAyah": 10,
      "endAyah": 14
    },
    {
      "surah": 62,
      "startAyah": 1,
      "endAyah": 2
    }
  ],
  "470": [
    {
      "surah": 62,
      "startAyah": 3,
      "endAyah": 11
    }
  ],
  "471": [
    {
      "surah": 63,
      "startAyah": 1,
      "endAyah": 8
    }
  ],
  "472": [
    {
      "surah": 63,
      "startAyah": 9,
      "endAyah": 11
    },
    {
      "surah": 64,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "473": [
    {
      "surah": 64,
      "startAyah": 7,
      "endAyah": 16
    }
  ],
  "474": [
    {
      "surah": 64,
      "startAyah": 17,
      "endAyah": 18
    },
    {
      "surah": 65,
      "startAyah": 1,
      "endAyah": 3
    }
  ],
  "475": [
    {
      "surah": 65,
      "startAyah": 4,
      "endAyah": 11
    }
  ],
  "476": [
    {
      "surah": 65,
      "startAyah": 12,
      "endAyah": 12
    },
    {
      "surah": 66,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "477": [
    {
      "surah": 66,
      "startAyah": 6,
      "endAyah": 12
    }
  ],
  "478": [
    {
      "surah": 67,
      "startAyah": 1,
      "endAyah": 11
    }
  ],
  "479": [
    {
      "surah": 67,
      "startAyah": 12,
      "endAyah": 25
    }
  ],
  "480": [
    {
      "surah": 67,
      "startAyah": 26,
      "endAyah": 30
    },
    {
      "surah": 68,
      "startAyah": 1,
      "endAyah": 15
    }
  ],
  "481": [
    {
      "surah": 68,
      "startAyah": 16,
      "endAyah": 40
    }
  ],
  "482": [
    {
      "surah": 68,
      "startAyah": 41,
      "endAyah": 52
    },
    {
      "surah": 69,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "483": [
    {
      "surah": 69,
      "startAyah": 6,
      "endAyah": 30
    }
  ],
  "484": [
    {
      "surah": 69,
      "startAyah": 31,
      "endAyah": 52
    },
    {
      "surah": 70,
      "startAyah": 1,
      "endAyah": 3
    }
  ],
  "485": [
    {
      "surah": 70,
      "startAyah": 4,
      "endAyah": 36
    }
  ],
  "486": [
    {
      "surah": 70,
      "startAyah": 37,
      "endAyah": 44
    },
    {
      "surah": 71,
      "startAyah": 1,
      "endAyah": 6
    }
  ],
  "487": [
    {
      "surah": 71,
      "startAyah": 7,
      "endAyah": 27
    }
  ],
  "488": [
    {
      "surah": 71,
      "startAyah": 28,
      "endAyah": 28
    },
    {
      "surah": 72,
      "startAyah": 1,
      "endAyah": 12
    }
  ],
  "489": [
    {
      "surah": 72,
      "startAyah": 13,
      "endAyah": 28
    }
  ],
  "490": [
    {
      "surah": 73,
      "startAyah": 1,
      "endAyah": 18
    }
  ],
  "491": [
    {
      "surah": 73,
      "startAyah": 19,
      "endAyah": 20
    },
    {
      "surah": 74,
      "startAyah": 1,
      "endAyah": 12
    }
  ],
  "492": [
    {
      "surah": 74,
      "startAyah": 13,
      "endAyah": 42
    }
  ],
  "493": [
    {
      "surah": 74,
      "startAyah": 43,
      "endAyah": 56
    },
    {
      "surah": 75,
      "startAyah": 1,
      "endAyah": 11
    }
  ],
  "494": [
    {
      "surah": 75,
      "startAyah": 12,
      "endAyah": 40
    }
  ],
  "495": [
    {
      "surah": 76,
      "startAyah": 1,
      "endAyah": 18
    }
  ],
  "496": [
    {
      "surah": 76,
      "startAyah": 19,
      "endAyah": 31
    }
  ],
  "497": [
    {
      "surah": 77,
      "startAyah": 1,
      "endAyah": 35
    }
  ],
  "498": [
    {
      "surah": 77,
      "startAyah": 36,
      "endAyah": 50
    },
    {
      "surah": 78,
      "startAyah": 1,
      "endAyah": 13
    }
  ],
  "499": [
    {
      "surah": 78,
      "startAyah": 14,
      "endAyah": 40
    }
  ],
  "500": [
    {
      "surah": 79,
      "startAyah": 1,
      "endAyah": 34
    }
  ],
  "501": [
    {
      "surah": 79,
      "startAyah": 35,
      "endAyah": 46
    },
    {
      "surah": 80,
      "startAyah": 1,
      "endAyah": 17
    }
  ],
  "502": [
    {
      "surah": 80,
      "startAyah": 18,
      "endAyah": 42
    },
    {
      "surah": 81,
      "startAyah": 1,
      "endAyah": 8
    }
  ],
  "503": [
    {
      "surah": 81,
      "startAyah": 9,
      "endAyah": 29
    },
    {
      "surah": 82,
      "startAyah": 1,
      "endAyah": 7
    }
  ],
  "504": [
    {
      "surah": 82,
      "startAyah": 8,
      "endAyah": 19
    },
    {
      "surah": 83,
      "startAyah": 1,
      "endAyah": 14
    }
  ],
  "505": [
    {
      "surah": 83,
      "startAyah": 15,
      "endAyah": 36
    },
    {
      "surah": 84,
      "startAyah": 1,
      "endAyah": 3
    }
  ],
  "506": [
    {
      "surah": 84,
      "startAyah": 4,
      "endAyah": 25
    },
    {
      "surah": 85,
      "startAyah": 1,
      "endAyah": 3
    }
  ],
  "507": [
    {
      "surah": 85,
      "startAyah": 4,
      "endAyah": 22
    },
    {
      "surah": 86,
      "startAyah": 1,
      "endAyah": 3
    }
  ],
  "508": [
    {
      "surah": 86,
      "startAyah": 4,
      "endAyah": 17
    },
    {
      "surah": 87,
      "startAyah": 1,
      "endAyah": 15
    }
  ],
  "509": [
    {
      "surah": 87,
      "startAyah": 16,
      "endAyah": 19
    },
    {
      "surah": 88,
      "startAyah": 1,
      "endAyah": 26
    }
  ],
  "510": [
    {
      "surah": 89,
      "startAyah": 1,
      "endAyah": 23
    }
  ],
  "511": [
    {
      "surah": 89,
      "startAyah": 24,
      "endAyah": 30
    },
    {
      "surah": 90,
      "startAyah": 1,
      "endAyah": 20
    }
  ],
  "512": [
    {
      "surah": 91,
      "startAyah": 1,
      "endAyah": 15
    },
    {
      "surah": 92,
      "startAyah": 1,
      "endAyah": 9
    }
  ],
  "513": [
    {
      "surah": 92,
      "startAyah": 10,
      "endAyah": 21
    },
    {
      "surah": 93,
      "startAyah": 1,
      "endAyah": 11
    }
  ],
  "514": [
    {
      "surah": 94,
      "startAyah": 1,
      "endAyah": 8
    },
    {
      "surah": 95,
      "startAyah": 1,
      "endAyah": 8
    },
    {
      "surah": 96,
      "startAyah": 1,
      "endAyah": 2
    }
  ],
  "515": [
    {
      "surah": 96,
      "startAyah": 3,
      "endAyah": 19
    },
    {
      "surah": 97,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "516": [
    {
      "surah": 98,
      "startAyah": 1,
      "endAyah": 8
    },
    {
      "surah": 99,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "517": [
    {
      "surah": 99,
      "startAyah": 6,
      "endAyah": 8
    },
    {
      "surah": 100,
      "startAyah": 1,
      "endAyah": 11
    },
    {
      "surah": 101,
      "startAyah": 1,
      "endAyah": 4
    }
  ],
  "518": [
    {
      "surah": 101,
      "startAyah": 5,
      "endAyah": 11
    },
    {
      "surah": 102,
      "startAyah": 1,
      "endAyah": 8
    },
    {
      "surah": 103,
      "startAyah": 1,
      "endAyah": 3
    }
  ],
  "519": [
    {
      "surah": 104,
      "startAyah": 1,
      "endAyah": 9
    },
    {
      "surah": 105,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "520": [
    {
      "surah": 106,
      "startAyah": 1,
      "endAyah": 4
    },
    {
      "surah": 107,
      "startAyah": 1,
      "endAyah": 7
    },
    {
      "surah": 108,
      "startAyah": 1,
      "endAyah": 3
    }
  ],
  "521": [
    {
      "surah": 109,
      "startAyah": 1,
      "endAyah": 6
    },
    {
      "surah": 110,
      "startAyah": 1,
      "endAyah": 3
    },
    {
      "surah": 111,
      "startAyah": 1,
      "endAyah": 5
    }
  ],
  "522": [
    {
      "surah": 112,
      "startAyah": 1,
      "endAyah": 4
    },
    {
      "surah": 113,
      "startAyah": 1,
      "endAyah": 5
    },
    {
      "surah": 114,
      "startAyah": 1,
      "endAyah": 6
    }
  ]
};

/**
 * Returns the Shamarly page number for a given Surah and Ayah.
 */
export function getShamarlyPageForAyah(surahNumber: number, ayahNumber: number): number {
  if (surahNumber < 1 || surahNumber > 114) return 2;
  const safeAyah = Math.max(1, ayahNumber);

  for (const [pageStr, segments] of Object.entries(SHAMARLY_PAGE_SEGMENTS)) {
    const page = Number(pageStr);
    for (const seg of segments) {
      if (seg.surah === surahNumber && safeAyah >= seg.startAyah && safeAyah <= seg.endAyah) {
        return page;
      }
    }
  }

  // Fallback to Surah start page
  return SHAMARLY_SURAH_START_PAGES[surahNumber] || 2;
}

/**
 * Returns the starting Shamarly page for a given Surah number.
 */
export function getShamarlyPageForSurah(surahNumber: number): number {
  return SHAMARLY_SURAH_START_PAGES[surahNumber] || 2;
}

/**
 * Returns the Juz number for a given Shamarly page.
 */
export function getShamarlyJuzForPage(pageNumber: number): number {
  if (pageNumber <= 1) return 1;
  let currentJuz = 1;
  for (let juz = 1; juz <= 30; juz++) {
    const startPage = SHAMARLY_JUZ_START_PAGES[juz];
    if (startPage && pageNumber >= startPage) {
      currentJuz = juz;
    } else {
      break;
    }
  }
  return currentJuz;
}

/**
 * Returns primary surah and summary of ayahs on a Shamarly page.
 */
export function getShamarlyPageInfo(pageNumber: number) {
  const segments = SHAMARLY_PAGE_SEGMENTS[pageNumber] || [];
  const juz = getShamarlyJuzForPage(pageNumber);
  const primarySurah = segments.length > 0 ? segments[0].surah : 1;
  return {
    pageNumber,
    juzNumber: juz,
    primarySurah,
    segments
  };
}
