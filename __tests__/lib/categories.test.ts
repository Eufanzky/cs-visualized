import {
  CATEGORIES,
  getCategoryById,
  getAnimationById,
  TOTAL_ANIMATIONS,
  READY_ANIMATIONS,
} from '@/lib/categories';

// ── CATEGORIES structure ────────────────────────────────────────────────────

describe('CATEGORIES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(CATEGORIES)).toBe(true);
    expect(CATEGORIES.length).toBeGreaterThan(0);
  });

  it('every category has the required fields', () => {
    const requiredFields = [
      'id',
      'title',
      'icon',
      'accent',
      'glow',
      'accentHex',
      'glowRgba',
      'description',
      'animations',
    ] as const;

    for (const cat of CATEGORIES) {
      for (const field of requiredFields) {
        expect(cat).toHaveProperty(field);
      }
    }
  });

  it('all category IDs are unique', () => {
    const ids = CATEGORIES.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all category IDs use kebab-case (no spaces or uppercase)', () => {
    for (const cat of CATEGORIES) {
      expect(cat.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('each category has at least one animation', () => {
    for (const cat of CATEGORIES) {
      expect(cat.animations.length).toBeGreaterThan(0);
    }
  });

  it('all animation IDs within a category are unique', () => {
    for (const cat of CATEGORIES) {
      const ids = cat.animations.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    }
  });

  it('all animation statuses are either "ready" or "coming"', () => {
    for (const cat of CATEGORIES) {
      for (const anim of cat.animations) {
        expect(['ready', 'coming']).toContain(anim.status);
      }
    }
  });

  it('every animation has a non-empty title and complexity', () => {
    for (const cat of CATEGORIES) {
      for (const anim of cat.animations) {
        expect(typeof anim.title).toBe('string');
        expect(anim.title.length).toBeGreaterThan(0);
        expect(typeof anim.complexity).toBe('string');
        expect(anim.complexity.length).toBeGreaterThan(0);
      }
    }
  });

  it('every animation ID uses kebab-case', () => {
    for (const cat of CATEGORIES) {
      for (const anim of cat.animations) {
        expect(anim.id).toMatch(/^[a-z0-9-]+$/);
      }
    }
  });
});

// ── getCategoryById ─────────────────────────────────────────────────────────

describe('getCategoryById', () => {
  it('returns the correct category for a known ID', () => {
    const cat = getCategoryById('sorting-algorithms');
    expect(cat).toBeDefined();
    expect(cat!.id).toBe('sorting-algorithms');
    expect(cat!.title).toBe('Sorting Algorithms');
  });

  it('returns undefined for an unknown ID', () => {
    expect(getCategoryById('does-not-exist')).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getCategoryById('')).toBeUndefined();
  });

  it('finds every category in CATEGORIES by its own ID', () => {
    for (const cat of CATEGORIES) {
      const found = getCategoryById(cat.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(cat.id);
    }
  });
});

// ── getAnimationById ────────────────────────────────────────────────────────

describe('getAnimationById', () => {
  it('returns the correct result for a known category + animation', () => {
    const result = getAnimationById('sorting-algorithms', 'bubble-sort');
    expect(result).toBeDefined();
    expect(result!.category.id).toBe('sorting-algorithms');
    expect(result!.animation.id).toBe('bubble-sort');
  });

  it('returns undefined for an unknown category', () => {
    expect(getAnimationById('no-such-category', 'bubble-sort')).toBeUndefined();
  });

  it('returns undefined for an unknown animation within a valid category', () => {
    expect(
      getAnimationById('sorting-algorithms', 'no-such-animation'),
    ).toBeUndefined();
  });

  it('returns undefined for both unknown category and animation', () => {
    expect(getAnimationById('x', 'y')).toBeUndefined();
  });

  it('the returned animation object matches the one in CATEGORIES', () => {
    const result = getAnimationById('sorting-algorithms', 'bubble-sort');
    const cat = getCategoryById('sorting-algorithms');
    const anim = cat!.animations.find((a) => a.id === 'bubble-sort');
    expect(result!.animation).toEqual(anim);
  });
});

// ── TOTAL_ANIMATIONS / READY_ANIMATIONS ─────────────────────────────────────

describe('TOTAL_ANIMATIONS', () => {
  it('equals the sum of all animations across all categories', () => {
    const sum = CATEGORIES.reduce((acc, c) => acc + c.animations.length, 0);
    expect(TOTAL_ANIMATIONS).toBe(sum);
  });

  it('is a positive integer', () => {
    expect(Number.isInteger(TOTAL_ANIMATIONS)).toBe(true);
    expect(TOTAL_ANIMATIONS).toBeGreaterThan(0);
  });
});

describe('READY_ANIMATIONS', () => {
  it('equals the count of animations with status "ready"', () => {
    const count = CATEGORIES.reduce(
      (acc, c) => acc + c.animations.filter((a) => a.status === 'ready').length,
      0,
    );
    expect(READY_ANIMATIONS).toBe(count);
  });

  it('is less than or equal to TOTAL_ANIMATIONS', () => {
    expect(READY_ANIMATIONS).toBeLessThanOrEqual(TOTAL_ANIMATIONS);
  });

  it('is a non-negative integer', () => {
    expect(Number.isInteger(READY_ANIMATIONS)).toBe(true);
    expect(READY_ANIMATIONS).toBeGreaterThanOrEqual(0);
  });
});
