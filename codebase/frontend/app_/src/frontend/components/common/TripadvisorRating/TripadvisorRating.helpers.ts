export const HALF_OF_STAR = 0.5;
export const ROUND_DOWN_STAR = 0.3;
export const ROUND_UP_STAR = 0.8;

export const STAR_IDS = ['1', '2', '3', '4', '5'] as const;

export const roundRating = (rating: number): number => {
    const decimal = Number((rating % 1).toFixed(1));
    const whole = Math.floor(rating);

    if (decimal < ROUND_DOWN_STAR) return whole;

    if (decimal >= ROUND_DOWN_STAR && decimal < ROUND_UP_STAR) return whole + HALF_OF_STAR;

    return whole + 1;
};
