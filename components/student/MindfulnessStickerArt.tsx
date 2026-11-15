import React from 'react';
import { MindfulnessStickerId } from '../../types';

interface MindfulnessStickerArtProps {
  stickerId: MindfulnessStickerId;
  unlocked: boolean;
  size?: number;
  label?: string;
}

const MindfulnessStickerArt: React.FC<MindfulnessStickerArtProps> = ({
  stickerId,
  unlocked,
  size = 76,
  label,
}) => {
  const renderArtwork = () => {
    switch (stickerId) {
      case 'breeze_buddy':
        return (
          <>
            {/* Die-cut white sticker backing */}
            <circle cx="50" cy="50" r="44" fill="#ffffff" stroke="#99e2d8" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="39" fill="#e6faf6" />
            {/* Cute turquoise cloud */}
            <path
              d="M27 56c-6 0-10-4.5-10-10 0-5.2 4-9.5 9-9.9 1.9-7.5 8.7-13.1 16.8-13.1 9.1 0 16.5 7 17.2 15.9 4.5.7 8 4.6 8 9.4 0 5.3-4.3 9.7-9.6 9.7H27z"
              fill="#5eead4"
              stroke="#0f766e"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Calm smiling eyes */}
            <path d="M35 44c1.2-1.8 3.6-1.8 4.8 0" stroke="#0f3d3e" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M47 44c1.2-1.8 3.6-1.8 4.8 0" stroke="#0f3d3e" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M41 49c1.5 1.5 3.5 1.5 5 0" stroke="#0f3d3e" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Gentle breeze curl */}
            <path
              d="M58 63h16c3 0 5-2 5-4.5S77 54 74.5 54c-2 0-3.5 1.4-3.5 3"
              stroke="#0284c7"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M32 69h28c2.4 0 4 1.6 4 3.6S62.4 76 60 76"
              stroke="#14b8a6"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </>
        );

      case 'ink_owl':
        return (
          <>
            <circle cx="50" cy="50" r="44" fill="#ffffff" stroke="#fed7aa" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="39" fill="#fff7ed" />
            {/* Owl body */}
            <ellipse cx="47" cy="54" rx="19" ry="21" fill="#fb923c" stroke="#9a3412" strokeWidth="2.2" />
            {/* Belly */}
            <ellipse cx="47" cy="60" rx="11.5" ry="12" fill="#ffedd5" />
            {/* Ear tufts */}
            <path d="M31 38l5-7 6 6" fill="#fb923c" stroke="#9a3412" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M63 38l-5-7-6 6" fill="#fb923c" stroke="#9a3412" strokeWidth="2.2" strokeLinejoin="round" />
            {/* Big eyes */}
            <circle cx="40" cy="46" r="6.5" fill="#ffffff" stroke="#9a3412" strokeWidth="2" />
            <circle cx="54" cy="46" r="6.5" fill="#ffffff" stroke="#9a3412" strokeWidth="2" />
            <circle cx="40.5" cy="46" r="2.7" fill="#0f3d3e" />
            <circle cx="54.5" cy="46" r="2.7" fill="#0f3d3e" />
            {/* Beak */}
            <path d="M45 50l2 3.5 2-3.5z" fill="#f59e0b" stroke="#9a3412" strokeWidth="1.5" strokeLinejoin="round" />
            {/* Feather quill */}
            <path
              d="M66 68c2-11 7-20 14-26 1 9-3 18-11 23l-3 3z"
              fill="#14b8a6"
              stroke="#0f766e"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M64 72l12-22" stroke="#0f3d3e" strokeWidth="1.8" strokeLinecap="round" />
          </>
        );

      case 'sunbeam_sprinter':
        return (
          <>
            <circle cx="50" cy="50" r="44" fill="#ffffff" stroke="#86efac" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="39" fill="#ecfdf5" />
            {/* Warm sun halo */}
            <circle cx="50" cy="42" r="16" fill="#fde047" stroke="#ca8a04" strokeWidth="2" />
            {/* Sun rays */}
            <path
              d="M50 18v5M50 61v5M26 42h5M69 42h5M33 25l3.5 3.5M63.5 55.5L67 59M67 25l-3.5 3.5M36.5 55.5L33 59"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Vibrant sprout */}
            <path d="M50 76V52" stroke="#059669" strokeWidth="3.2" strokeLinecap="round" />
            <path
              d="M50 62c-10 0-16-6-16-14 9 0 16 5 16 14z"
              fill="#34d399"
              stroke="#065f46"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M50 58c10 0 16-6 16-14-9 0-16 5-16 14z"
              fill="#10b981"
              stroke="#065f46"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M35 76h30" stroke="#059669" strokeWidth="2.6" strokeLinecap="round" />
          </>
        );

      case 'lotus_spark':
        return (
          <>
            <circle cx="50" cy="50" r="44" fill="#ffffff" stroke="#a5b4fc" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="39" fill="#eef2ff" />
            {/* Side petals */}
            <path
              d="M50 67c-15 0-24-9-24-21 10 0 19 6 24 21z"
              fill="#818cf8"
              stroke="#3730a3"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M50 67c15 0 24-9 24-21-10 0-19 6-24 21z"
              fill="#818cf8"
              stroke="#3730a3"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Inner petals */}
            <path
              d="M50 67c-10-4-14-15-10-27 8 4 12 14 10 27z"
              fill="#a5b4fc"
              stroke="#3730a3"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M50 67c10-4 14-15 10-27-8 4-12 14-10 27z"
              fill="#a5b4fc"
              stroke="#3730a3"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Center petal */}
            <path
              d="M50 28c7 10 7 25 0 39-7-14-7-29 0-39z"
              fill="#38bdf8"
              stroke="#3730a3"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Sparkle */}
            <path d="M50 18l1.6 3.8 3.8 1.6-3.8 1.6L50 28.8 48.4 25l-3.8-1.6 3.8-1.6z" fill="#f59e0b" />
          </>
        );

      case 'moonbeam_drifter':
        return (
          <>
            <circle cx="50" cy="50" r="44" fill="#ffffff" stroke="#7dd3fc" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="39" fill="#0f3d3e" />
            {/* Crescent moon */}
            <path
              d="M57 25c-11.5 1.8-19.5 12.6-17.7 24.1 1.6 10.5 10.6 18 21.1 18 3.3 0 6.5-.8 9.3-2.2-3.4 5.7-9.6 9.6-16.8 9.6-10.8 0-19.6-8.8-19.6-19.6 0-12.1 10.5-21.6 23.7-29.9z"
              fill="#fde68a"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Gentle stars */}
            <path d="M67 30l1.8 4.2 4.2 1.8-4.2 1.8L67 42l-1.8-4.2L61 36l4.2-1.8z" fill="#7dd3fc" />
            <circle cx="71" cy="52" r="2.5" fill="#99f6e4" />
            <circle cx="30" cy="31" r="2" fill="#bae6fd" />
          </>
        );

      case 'first_bloom':
        return (
          <>
            <circle cx="50" cy="50" r="44" fill="#ffffff" stroke="#8ce0d2" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="39" fill="#eefaf7" />
            {/* Pot */}
            <path
              d="M36 58h28l-3.5 18h-21z"
              fill="#14b8a6"
              stroke="#0f766e"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <rect x="33" y="53" width="34" height="6" rx="3" fill="#2dd4bf" stroke="#0f766e" strokeWidth="2" />
            {/* Stem */}
            <path d="M50 53V37" stroke="#059669" strokeWidth="2.8" strokeLinecap="round" />
            {/* Flower petals */}
            <circle cx="50" cy="25" r="5.5" fill="#fb7185" stroke="#be123c" strokeWidth="1.6" />
            <circle cx="42" cy="31" r="5.5" fill="#fda4af" stroke="#be123c" strokeWidth="1.6" />
            <circle cx="58" cy="31" r="5.5" fill="#fda4af" stroke="#be123c" strokeWidth="1.6" />
            <circle cx="44.5" cy="39" r="5.5" fill="#fb7185" stroke="#be123c" strokeWidth="1.6" />
            <circle cx="55.5" cy="39" r="5.5" fill="#fb7185" stroke="#be123c" strokeWidth="1.6" />
            <circle cx="50" cy="33" r="5.2" fill="#fde047" stroke="#ca8a04" strokeWidth="1.8" />
          </>
        );

      case 'hat_trick_star':
        return (
          <>
            <circle cx="50" cy="50" r="44" fill="#ffffff" stroke="#fcd34d" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="39" fill="#fffbeb" />
            {/* Top star */}
            <path
              d="M50 20l4.3 8.8 9.7 1.4-7 6.8 1.6 9.6-8.6-4.5-8.6 4.5 1.6-9.6-7-6.8 9.7-1.4z"
              fill="#fbbf24"
              stroke="#b45309"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Bottom-left teal star */}
            <path
              d="M34 49l3.2 6.5 7.2 1-5.2 5.1 1.2 7.1-6.4-3.4-6.4 3.4 1.2-7.1-5.2-5.1 7.2-1z"
              fill="#2dd4bf"
              stroke="#0f766e"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Bottom-right indigo star */}
            <path
              d="M66 49l3.2 6.5 7.2 1-5.2 5.1 1.2 7.1-6.4-3.4-6.4 3.4 1.2-7.1-5.2-5.1 7.2-1z"
              fill="#818cf8"
              stroke="#3730a3"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </>
        );

      case 'weekly_crown':
        return (
          <>
            <circle cx="50" cy="50" r="44" fill="#ffffff" stroke="#e879f9" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="39" fill="#fdf4ff" />
            {/* Rainbow arch */}
            <path d="M23 58a27 27 0 0 1 54 0" fill="none" stroke="#f43f5e" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M29 58a21 21 0 0 1 42 0" fill="none" stroke="#f59e0b" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M35 58a15 15 0 0 1 30 0" fill="none" stroke="#14b8a6" strokeWidth="5.5" strokeLinecap="round" />
            {/* Calm waves */}
            <path
              d="M22 63c5 3 10 3 15 0s10-3 15 0 10 3 15 0 7-2 11 0"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M27 71c5 2.5 9 2.5 14 0s9-2.5 14 0 9 2.5 14 0"
              fill="none"
              stroke="#0d9488"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`shrink-0 transition-transform duration-200 ${
        unlocked ? 'drop-shadow-[0_6px_12px_rgba(15,61,62,0.14)]' : 'opacity-40 grayscale'
      }`}
    >
      {renderArtwork()}
    </svg>
  );
};

export default MindfulnessStickerArt;
