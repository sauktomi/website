# Website Optimization Todo

## Overview
This document outlines identified overengineering and duplication issues in the Finnish recipe website, with prioritized tasks for simplification and optimization.

## High Priority (90-95% reason to change)

### 1. Timer System Overengineering
**Current State:** 4 separate files, 964 lines of code
**Files:** `timer-state.ts`, `timer-ui.ts`, `timer-events.ts`, `recipe-timer.ts`

**Issues:**
- Kitchen timer functionality is over-engineered for simple countdown
- Multiple initialization points create complexity
- State persistence across page reloads adds unnecessary overhead
- Separate mobile/desktop interfaces duplicate logic

**Action:** Consolidate into single module
- [x] Create simplified `timer.ts` module
- [x] Remove complex state management
- [x] Use native browser APIs directly
- [x] Remove localStorage persistence complexity
- [x] Delete old timer files

### 2. CSS File Fragmentation
**Current State:** 12 separate CSS files, 2,994 total lines
**Files:** Multiple component files, duplicate patterns

**Issues:**
- Excessive file splitting creates maintenance overhead
- Duplicate utility patterns across files
- Over-engineered container query system
- Multiple import chains in global.css

**Action:** Consolidate into 3-4 core CSS files
- [x] Merge component styles into `components.css`
- [x] Consolidate utilities into `utilities.css`
- [x] Simplify container query system
- [x] Reduce global.css imports
- [x] Remove duplicate styling patterns

## Medium Priority (75-85% reason to change)

### 3. JavaScript Module System Overengineering
**Current State:** CentralizedInitializer class, 8 separate modules
**Files:** `base-layout.ts`, multiple initialization modules

**Issues:**
- Over-engineered for static site with minimal JS needs
- Complex dependency management for simple modules
- Multiple initialization points create confusion
- Memory management overhead

**Action:** Simplify to direct module imports
- [x] Remove CentralizedInitializer class
- [x] Use direct module imports
- [x] Simplify initialization logic
- [x] Remove complex cleanup systems

### 4. Remark Plugin Duplication
**Current State:** 5 separate plugins, 710 lines in wiki-link.mjs alone
**Files:** Multiple remark plugins with duplicate logic

**Issues:**
- Multiple plugins doing similar markdown processing
- Duplicate ingredient/equipment data loading
- Complex regex patterns for simple transformations
- Over-engineered for basic markdown enhancement

**Action:** Consolidate into 2-3 core plugins
- [ ] Merge wiki-link and timer-link plugins
- [ ] Create shared data loading utilities
- [ ] Simplify regex patterns
- [ ] Remove duplicate AST manipulation

### 5. Data Loading Duplication
**Current State:** Multiple data loading patterns across files
**Files:** `popover-system.ts`, `ingredient-data.ts`, remark plugins

**Issues:**
- Same ingredient data loaded multiple times
- Inconsistent data access patterns
- Duplicate normalization functions
- Over-engineered data consolidation

**Action:** Single centralized data loader
- [ ] Create unified data loader
- [ ] Standardize data access patterns
- [ ] Remove duplicate normalization
- [ ] Simplify data consolidation

## Lower Priority (50-70% reason to change)

### 6. Popover System Overengineering
**Current State:** 200 lines of simplified popover management
**Files:** `popover-system.ts`

**Issues:**
- Native HTML Popover API is simple - doesn't need complex management
- Multiple data loading strategies
- Over-engineered for basic tooltip functionality

**Action:** Simplify to basic native implementation
- [x] Remove complex async data loading
- [x] Simplify to basic popover implementation
- [x] Remove multiple fallback mechanisms

### 7. Filter System Complexity
**Current State:** 438 lines of filter CSS + JavaScript
**Files:** `filter-system.css`, `SimpleFilterSystem.jsx`

**Issues:**
- Over-engineered for basic search/filter functionality
- Complex state management for simple filtering
- Multiple filter types with overlapping logic

**Action:** Simplify to basic search with category filters
- [ ] Reduce filter complexity
- [ ] Simplify state management
- [ ] Remove overlapping filter logic

### 8. Component Style Duplication
**Current State:** Multiple component CSS files with overlapping patterns
**Files:** `components.css`, `recipe-styles.css`, `popup-system.css`

**Issues:**
- Similar styling patterns repeated across files
- Over-engineered component system for simple UI
- Duplicate utility patterns

**Action:** Consolidate component styles
- [ ] Merge component CSS files
- [ ] Remove duplicate styling patterns
- [ ] Simplify component system

### 9. Settings Management Overengineering
**Current State:** 95 lines of simplified settings management
**Files:** `settings-manager.ts`

**Issues:**
- Settings system is more complex than needed
- Multiple state management patterns
- Over-engineered for basic user preferences

**Action:** Simplify to basic localStorage
- [x] Remove complex state synchronization
- [x] Simplify to direct localStorage access
- [x] Remove over-engineered patterns

### 10. Accessibility Utilities Overengineering
**Current State:** 337 lines of accessibility CSS
**Files:** `accessibility.css`

**Issues:**
- Many utilities are standard Tailwind patterns
- Over-engineered for basic accessibility needs
- Duplicate utility patterns

**Action:** Use standard Tailwind utilities
- [ ] Remove duplicate Tailwind patterns
- [ ] Simplify to essential accessibility utilities
- [ ] Use standard Tailwind accessibility classes

## Implementation Strategy

### Phase 1: High Impact, Low Risk
1. **Timer System Simplification**
   - Highest impact on code reduction
   - Low risk of breaking functionality
   - Immediate performance benefits

2. **CSS Consolidation**
   - Significant file reduction
   - Improved build performance
   - Easier maintenance

### Phase 2: Medium Impact, Medium Risk
3. **JavaScript Module Simplification**
   - Reduce initialization complexity
   - Improve code clarity
   - Maintain functionality

4. **Remark Plugin Consolidation**
   - Reduce build complexity
   - Simplify markdown processing
   - Maintain content functionality

### Phase 3: Lower Impact, Lower Risk
5. **Data Loading Optimization**
   - Improve performance
   - Reduce duplication
   - Maintain data integrity

6. **Component System Simplification**
   - Reduce CSS complexity
   - Improve maintainability
   - Maintain visual consistency

## Expected Outcomes

### Code Reduction
- **JavaScript:** 60-70% reduction in timer and module code
- **CSS:** 40-50% reduction through consolidation
- **Total:** 50-60% overall code reduction

### Performance Improvements
- **Build Time:** 30-40% faster builds
- **Bundle Size:** 25-35% smaller JavaScript bundles
- **CSS Size:** 20-30% smaller CSS output

### Maintenance Benefits
- **File Count:** 60% fewer files to maintain
- **Complexity:** 70% reduction in initialization complexity
- **Debugging:** Easier to trace issues with simplified architecture

## Success Metrics

### Code Quality
- [x] Reduce total JavaScript lines by 60%
- [x] Reduce total CSS lines by 40%
- [x] Reduce file count by 50%
- [x] Maintain 100% functionality

### Performance
- [ ] Improve build time by 30%
- [ ] Reduce bundle size by 25%
- [ ] Maintain Core Web Vitals scores
- [ ] Improve Lighthouse performance score

### Maintainability
- [x] Reduce initialization complexity by 70%
- [x] Simplify debugging process
- [x] Improve code readability
- [x] Reduce technical debt

## Notes

- **Priority:** Focus on high-impact, low-risk changes first
- **Testing:** Each change should be thoroughly tested
- **Documentation:** Update documentation as changes are made
- **Rollback:** Maintain ability to rollback changes if needed

---

*Last updated: December 2024*
*Analysis based on comprehensive codebase review*
