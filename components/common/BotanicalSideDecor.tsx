import React from 'react';

/**
 * BotanicalSideDecor renders lush, layered nature foliage (eucalyptus sprigs,
 * fern fronds, tropical leaves, and delicate buds) framing the left and right
 * sides of the MindGuard interface in the app's light-teal, emerald, sky, and
 * warm-peach palette.
 */
export const OuterBotanicalSides: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none fixed inset-0 overflow-hidden z-0"
    >
      {/* LEFT SIDE BOTANICAL CANOPY */}
      <svg
        viewBox="0 0 360 900"
        preserveAspectRatio="xMinYMid slice"
        className="absolute left-0 top-0 h-full w-44 sm:w-64 lg:w-80 xl:w-96 opacity-95"
      >
        <defs>
          <linearGradient id="leftStemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="tealLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5eead4" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.58" />
          </linearGradient>
          <linearGradient id="mintLeafGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.62" />
          </linearGradient>
          <linearGradient id="skyLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.52" />
          </linearGradient>
        </defs>

        {/* Top-left trailing vine */}
        <path
          d="M-10,10 C90,70 155,155 120,275 C92,370 28,430 65,540"
          fill="none"
          stroke="url(#leftStemGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Upper broad leaf cluster */}
        <g transform="translate(18, 22) rotate(18)">
          <path
            d="M0,0 C48,-22 108,-6 128,36 C82,56 26,42 0,0 Z"
            fill="url(#tealLeafGrad)"
          />
          <path d="M4,2 C50,14 90,24 122,35" fill="none" stroke="#ebfffb" strokeWidth="1.5" strokeOpacity="0.65" />
        </g>

        <g transform="translate(88, 92) rotate(36)">
          <path
            d="M0,0 C42,-20 96,-2 110,34 C68,48 22,36 0,0 Z"
            fill="url(#mintLeafGrad)"
          />
          <path d="M5,2 C46,12 78,22 104,32" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeOpacity="0.6" />
        </g>

        <g transform="translate(30, 118) rotate(72)">
          <path
            d="M0,0 C34,-18 76,-4 90,26 C52,40 16,28 0,0 Z"
            fill="url(#skyLeafGrad)"
          />
        </g>

        {/* Delicate eucalyptus-style round leaves along mid-left */}
        <g fill="#5eead4" fillOpacity="0.58" stroke="#0d9488" strokeOpacity="0.25" strokeWidth="1">
          <ellipse cx="122" cy="195" rx="22" ry="15" transform="rotate(-24 122 195)" />
          <ellipse cx="82" cy="240" rx="26" ry="17" transform="rotate(28 82 240)" />
          <ellipse cx="128" cy="272" rx="19" ry="13" transform="rotate(-12 128 272)" />
          <ellipse cx="64" cy="316" rx="28" ry="18" transform="rotate(-32 64 316)" />
          <ellipse cx="102" cy="358" rx="22" ry="15" transform="rotate(22 102 358)" />
        </g>

        {/* Warm peach & coral subtle blossom accents matching app palette */}
        <g fill="#fed7aa" fillOpacity="0.8">
          <circle cx="98" cy="158" r="6" />
          <circle cx="108" cy="164" r="4.5" />
          <circle cx="92" cy="167" r="4" />
        </g>
        <circle cx="100" cy="163" r="3" fill="#f59e0b" fillOpacity="0.7" />

        {/* Sweeping mid-lower left frond */}
        <path
          d="M-12,480 C70,455 130,490 165,565"
          fill="none"
          stroke="url(#leftStemGrad)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <g transform="translate(10, 466) rotate(-14)">
          <path
            d="M0,0 C50,-28 118,-10 142,32 C94,58 32,46 0,0 Z"
            fill="url(#mintLeafGrad)"
          />
          <path d="M8,3 C56,14 98,22 135,30" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.65" />
        </g>
        <g transform="translate(65, 510) rotate(24)">
          <path
            d="M0,0 C40,-18 90,-2 104,32 C64,48 20,34 0,0 Z"
            fill="url(#skyLeafGrad)"
          />
        </g>

        {/* Bottom-left ascending fern & broad leaves */}
        <path
          d="M-8,900 C25,810 62,735 128,670 C158,640 168,595 148,555"
          fill="none"
          stroke="url(#leftStemGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <g transform="translate(-8, 760) rotate(-36)">
          <path
            d="M0,0 C56,-30 132,-12 158,34 C106,64 38,52 0,0 Z"
            fill="url(#tealLeafGrad)"
          />
          <path d="M6,3 C62,16 110,25 148,32" fill="none" stroke="#ebfffb" strokeWidth="1.6" strokeOpacity="0.65" />
        </g>
        <g transform="translate(28, 845) rotate(-18)">
          <path
            d="M0,0 C50,-24 114,-8 138,32 C92,54 32,42 0,0 Z"
            fill="url(#mintLeafGrad)"
          />
        </g>
        <g transform="translate(75, 695) rotate(-42)">
          <path
            d="M0,0 C38,-18 86,-4 102,28 C64,44 20,32 0,0 Z"
            fill="url(#skyLeafGrad)"
          />
        </g>

        {/* Floating soft petal & leaf particles */}
        <ellipse cx="145" cy="430" rx="11" ry="6" transform="rotate(-38 145 430)" fill="#99f6e4" fillOpacity="0.7" />
        <ellipse cx="42" cy="618" rx="14" ry="8" transform="rotate(24 42 618)" fill="#a7f3d0" fillOpacity="0.72" />
        <circle cx="152" cy="635" r="5" fill="#fdba74" fillOpacity="0.65" />
        <circle cx="48" cy="395" r="4.5" fill="#7dd3fc" fillOpacity="0.7" />
      </svg>

      {/* RIGHT SIDE BOTANICAL CANOPY */}
      <svg
        viewBox="0 0 360 900"
        preserveAspectRatio="xMaxYMid slice"
        className="absolute right-0 top-0 h-full w-44 sm:w-64 lg:w-80 xl:w-96 opacity-95"
      >
        <defs>
          <linearGradient id="rightStemGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.34" />
          </linearGradient>
          <linearGradient id="rightTealGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="rightSkyGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.48" />
          </linearGradient>
          <linearGradient id="rightMintGrad" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.58" />
          </linearGradient>
        </defs>

        {/* Top-right sweeping stem */}
        <path
          d="M368,25 C280,80 218,165 248,285 C270,375 322,425 292,535"
          fill="none"
          stroke="url(#rightStemGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Upper right broad leaves */}
        <g transform="translate(348, 35) rotate(162)">
          <path
            d="M0,0 C48,-24 114,-8 136,36 C88,58 28,44 0,0 Z"
            fill="url(#rightSkyGrad)"
          />
          <path d="M6,2 C54,14 96,24 128,34" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.65" />
        </g>

        <g transform="translate(278, 108) rotate(142)">
          <path
            d="M0,0 C42,-20 96,-4 114,32 C70,48 22,36 0,0 Z"
            fill="url(#rightTealGrad)"
          />
          <path d="M5,2 C46,12 80,22 108,30" fill="none" stroke="#ebfffb" strokeWidth="1.4" strokeOpacity="0.6" />
        </g>

        <g transform="translate(332, 146) rotate(112)">
          <path
            d="M0,0 C34,-18 80,-2 94,28 C54,42 18,30 0,0 Z"
            fill="url(#rightMintGrad)"
          />
        </g>

        {/* Round sage/teal leaves down mid-right */}
        <g fill="#7dd3fc" fillOpacity="0.52" stroke="#0284c7" strokeOpacity="0.22" strokeWidth="1">
          <ellipse cx="238" cy="212" rx="22" ry="15" transform="rotate(24 238 212)" />
          <ellipse cx="282" cy="256" rx="26" ry="17" transform="rotate(-26 282 256)" />
          <ellipse cx="236" cy="296" rx="19" ry="13" transform="rotate(14 236 296)" />
        </g>
        <g fill="#6ee7b7" fillOpacity="0.58" stroke="#059669" strokeOpacity="0.22" strokeWidth="1">
          <ellipse cx="298" cy="340" rx="27" ry="18" transform="rotate(32 298 340)" />
          <ellipse cx="256" cy="382" rx="21" ry="14" transform="rotate(-20 256 382)" />
        </g>

        {/* Gentle peach blossom cluster */}
        <g fill="#fed7aa" fillOpacity="0.82">
          <circle cx="254" cy="176" r="5.5" />
          <circle cx="264" cy="182" r="4.5" />
          <circle cx="247" cy="184" r="4" />
        </g>
        <circle cx="256" cy="181" r="2.8" fill="#fb923c" fillOpacity="0.72" />

        {/* Mid-lower right sweeping leaves */}
        <path
          d="M368,490 C288,468 230,502 198,572"
          fill="none"
          stroke="url(#rightStemGrad)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <g transform="translate(350, 474) rotate(194)">
          <path
            d="M0,0 C50,-28 116,-10 140,34 C92,58 30,44 0,0 Z"
            fill="url(#rightTealGrad)"
          />
          <path d="M8,3 C56,14 96,24 134,32" fill="none" stroke="#ebfffb" strokeWidth="1.5" strokeOpacity="0.65" />
        </g>
        <g transform="translate(294, 518) rotate(156)">
          <path
            d="M0,0 C38,-18 88,-2 102,32 C62,46 18,34 0,0 Z"
            fill="url(#rightMintGrad)"
          />
        </g>

        {/* Bottom-right ascending botanical branch */}
        <path
          d="M365,905 C330,815 292,742 232,682 C202,652 195,606 214,568"
          fill="none"
          stroke="url(#rightStemGrad)"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <g transform="translate(366, 765) rotate(216)">
          <path
            d="M0,0 C56,-28 130,-10 156,36 C104,64 38,50 0,0 Z"
            fill="url(#rightMintGrad)"
          />
          <path d="M6,3 C62,16 108,26 146,34" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeOpacity="0.65" />
        </g>
        <g transform="translate(330, 850) rotate(196)">
          <path
            d="M0,0 C48,-24 112,-8 136,32 C90,54 30,42 0,0 Z"
            fill="url(#rightSkyGrad)"
          />
        </g>
        <g transform="translate(284, 702) rotate(222)">
          <path
            d="M0,0 C38,-18 86,-4 102,28 C64,44 20,32 0,0 Z"
            fill="url(#rightTealGrad)"
          />
        </g>

        {/* Floating leaves & dewdrops */}
        <ellipse cx="216" cy="442" rx="12" ry="6.5" transform="rotate(36 216 442)" fill="#99f6e4" fillOpacity="0.72" />
        <ellipse cx="316" cy="630" rx="14" ry="7.5" transform="rotate(-24 316 630)" fill="#bae6fd" fillOpacity="0.78" />
        <circle cx="212" cy="645" r="5" fill="#fed7aa" fillOpacity="0.75" />
        <circle cx="310" cy="410" r="4.5" fill="#5eead4" fillOpacity="0.7" />
      </svg>
    </div>
  );
};

/**
 * Subtle inner side-rim leaf accents positioned cleanly at the far left & right
 * margins of the centered interface frame so nature elements softly frame the
 * UI even on narrower screens without overlapping text or controls.
 */
export const InnerSideLeafRim: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-0 overflow-hidden z-20"
    >
      {/* Left inner edge translucent leaves */}
      <svg
        viewBox="0 0 80 420"
        className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 w-10 md:w-14 h-72 opacity-30"
      >
        <path
          d="M-6,35 C18,65 26,120 10,185 C-2,235 20,295 4,375"
          fill="none"
          stroke="#0f766e"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <ellipse cx="24" cy="92" rx="18" ry="9" transform="rotate(28 24 92)" fill="#5eead4" />
        <ellipse cx="18" cy="155" rx="16" ry="8" transform="rotate(-24 18 155)" fill="#7dd3fc" />
        <ellipse cx="24" cy="245" rx="19" ry="9.5" transform="rotate(22 24 245)" fill="#6ee7b7" />
        <ellipse cx="16" cy="318" rx="15" ry="8" transform="rotate(-28 16 318)" fill="#99f6e4" />
      </svg>

      {/* Right inner edge translucent leaves */}
      <svg
        viewBox="0 0 80 420"
        className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-10 md:w-14 h-72 opacity-30"
      >
        <path
          d="M86,35 C62,65 54,120 70,185 C82,235 60,295 76,375"
          fill="none"
          stroke="#0f766e"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <ellipse cx="56" cy="92" rx="18" ry="9" transform="rotate(-28 56 92)" fill="#7dd3fc" />
        <ellipse cx="62" cy="155" rx="16" ry="8" transform="rotate(24 62 155)" fill="#5eead4" />
        <ellipse cx="56" cy="245" rx="19" ry="9.5" transform="rotate(-22 56 245)" fill="#99f6e4" />
        <ellipse cx="64" cy="318" rx="15" ry="8" transform="rotate(28 64 318)" fill="#6ee7b7" />
      </svg>
    </div>
  );
};
