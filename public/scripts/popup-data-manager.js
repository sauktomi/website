// Popup Data Manager Module
// Extracted from ReferencePageLayout.astro

class PopupDataManager {
  static setPopupData(data) {
    if (typeof window !== 'undefined') {
      window.ingredientsData = data;
    }
  }

  static getPopupData() {
    if (typeof window !== 'undefined') {
      return window.ingredientsData;
    }
    return null;
  }

  static init(popupData) {
    if (popupData) {
      this.setPopupData(popupData);
    }
  }
}

// Export for global access
window.PopupDataManager = PopupDataManager; 