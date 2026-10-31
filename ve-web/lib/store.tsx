"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import { Product } from "./data";
import { Product as ApiProduct } from "@/types/product";
import { fetchApi } from "./api";
import { Toast, ToastType } from "@/app/components/Toast";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CartItem = {
  product: Product;
  quantity: number;
};

type User = {
  id: number;
  email: string;
  role: string;
};

type SiteSettingsState = {
  site_name: string;
  site_logo: string;
  whatsapp_number?: string;
  whatsapp_message?: string;
  is_whatsapp_active?: boolean;
  is_ai_active?: boolean;
};

type State = {
  cart: CartItem[];
  wishlist: Product[];
  isCartDrawerOpen: boolean;
  lastAddedProduct: Product | null;
  user: User | null;
  token: string | null;
  toasts: Toast[];
  buyNowItem: CartItem | null;
  isWhatsAppHidden: boolean;
  siteSettings: SiteSettingsState;
};

type Action =
  | { type: "ADD_TO_CART"; product: Product; openDrawer?: boolean }
  | { type: "REMOVE_FROM_CART"; productId: number }
  | { type: "UPDATE_QTY"; productId: number; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_WISHLIST"; product: Product }
  | { type: "CLEAR_WISHLIST" }
  | { type: "OPEN_CART_DRAWER" }
  | { type: "CLOSE_CART_DRAWER" }
  | { type: "SET_USER"; user: User | null; token: string | null }
  | { type: "LOGOUT" }
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "REMOVE_TOAST"; toastId: string }
  | { type: "SET_BUY_NOW"; item: CartItem }
  | { type: "CLEAR_BUY_NOW" }
  | { type: "SET_WHATSAPP_HIDDEN"; hidden: boolean }
  | { type: "SET_SITE_SETTINGS"; settings: SiteSettingsState };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existing = state.cart.find(
        (i) => i.product.id === action.product.id
      );
      const cart = existing
        ? state.cart.map((i) =>
            i.product.id === action.product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        : [...state.cart, { product: action.product, quantity: 1 }];
      return {
        ...state,
        cart,
        isCartDrawerOpen: action.openDrawer ?? false,
        lastAddedProduct: action.product,
      };
    }
    case "REMOVE_FROM_CART":
      return {
        ...state,
        cart: state.cart.filter((i) => i.product.id !== action.productId),
      };
    case "UPDATE_QTY":
      return {
        ...state,
        cart: state.cart
          .map((i) =>
            i.product.id === action.productId
              ? { ...i, quantity: action.quantity }
              : i
          )
          .filter((i) => i.quantity > 0),
      };
    case "CLEAR_CART":
      return { ...state, cart: [] };
    case "TOGGLE_WISHLIST": {
      const inWishlist = state.wishlist.some((p) => p.id === action.product.id);
      return {
        ...state,
        wishlist: inWishlist
          ? state.wishlist.filter((p) => p.id !== action.product.id)
          : [...state.wishlist, action.product],
      };
    }
    case "CLEAR_WISHLIST":
      return { ...state, wishlist: [] };
    case "OPEN_CART_DRAWER":
      return { ...state, isCartDrawerOpen: true };
    case "CLOSE_CART_DRAWER":
      return { ...state, isCartDrawerOpen: false };
    case "SET_USER":
      return { ...state, user: action.user, token: action.token };
    case "LOGOUT":
      return { ...state, user: null, token: null };
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    case "SET_BUY_NOW":
      return { ...state, buyNowItem: action.item };
    case "CLEAR_BUY_NOW":
      return { ...state, buyNowItem: null };
    case "SET_WHATSAPP_HIDDEN":
      return { ...state, isWhatsAppHidden: action.hidden };
    case "SET_SITE_SETTINGS":
      return { ...state, siteSettings: { ...state.siteSettings, ...action.settings } };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

type StoreContextValue = State & {
  addToCart: (product: Product, openDrawer?: boolean) => void;
  removeFromCart: (productId: number) => void;
  updateQty: (productId: number, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  isInWishlist: (productId: number) => boolean;
  cartTotal: number;
  cartCount: number;
  setUser: (user: User | null, token: string | null) => void;
  logout: () => void;
  validateStock: () => { isValid: boolean; errors: string[] };
  showToast: (message: string, type: ToastType) => void;
  removeToast: (toastId: string) => void;
  setBuyNow: (product: Product, quantity?: number) => void;
  clearBuyNow: () => void;
  setWhatsAppHidden: (hidden: boolean) => void;
  refreshSiteSettings: () => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

const DEFAULT_SITE_SETTINGS: SiteSettingsState = {
  site_name: "Velina Elite",
  site_logo: "/1776256116755-removebg-preview.png",
  whatsapp_number: "8801347375533",
  whatsapp_message: "Hello! I have a question about Velina Elite.",
  is_whatsapp_active: true,
  is_ai_active: true,
};

const initialState: State = {
  cart: [],
  wishlist: [],
  isCartDrawerOpen: false,
  lastAddedProduct: null,
  user: null,
  token: null,
  toasts: [],
  buyNowItem: null,
  isWhatsAppHidden: false,
  siteSettings: DEFAULT_SITE_SETTINGS,
};

// Load cart from localStorage
const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('velina_cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Load wishlist from localStorage
const loadWishlistFromStorage = (): Product[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('velina_wishlist');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const loadWhatsAppHiddenFromStorage = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('velina_whatsapp_hidden') === 'true';
  } catch {
    return false;
  }
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    cart: typeof window !== 'undefined' ? loadCartFromStorage() : [],
    wishlist: typeof window !== 'undefined' ? loadWishlistFromStorage() : [],
    isWhatsAppHidden: typeof window !== 'undefined' ? loadWhatsAppHiddenFromStorage() : false,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem("velina_customer_token");
    const userStr = localStorage.getItem("velina_customer_user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch({ type: "SET_USER", user, token });
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

  const addToCart = useCallback(
    (product: Product, openDrawer?: boolean) => {
      const existingItem = state.cart.find(item => item.product.id === product.id);
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      
      if (product.stockQuantity !== undefined && currentQuantity + 1 > product.stockQuantity) {
        // Show error toast
        const toast: Toast = {
          id: Date.now().toString(),
          type: "error",
          message: `Cannot add more "${product.name}". Only ${product.stockQuantity} item(s) available in stock.`,
          duration: 4000,
        };
        dispatch({ type: "ADD_TOAST", toast });
        return;
      }
      
      dispatch({ type: "ADD_TO_CART", product, openDrawer });
      
      // Show success toast
      const successToast: Toast = {
        id: (Date.now() + 1).toString(),
        type: "success",
        message: `"${product.name}" added to cart`,
        duration: 2000,
      };
      dispatch({ type: "ADD_TOAST", toast: successToast });
    },
    [state.cart]
  );
  const removeFromCart = useCallback(
    (productId: number) => {
      dispatch({ type: "REMOVE_FROM_CART", productId });
    },
    []
  );
  const updateQty = useCallback(
    (productId: number, quantity: number) => {
      const cartItem = state.cart.find(item => item.product.id === productId);
      if (cartItem && cartItem.product.stockQuantity !== undefined && quantity > cartItem.product.stockQuantity) {
        // Show error toast
        const toast: Toast = {
          id: Date.now().toString(),
          type: "error",
          message: `Cannot update quantity for "${cartItem.product.name}". Only ${cartItem.product.stockQuantity} item(s) available in stock.`,
          duration: 4000,
        };
        dispatch({ type: "ADD_TOAST", toast });
        return;
      }
      dispatch({ type: "UPDATE_QTY", productId, quantity });
    },
    [state.cart]
  );
  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), []);
  const toggleWishlist = useCallback(
    (product: Product) => {
      dispatch({ type: "TOGGLE_WISHLIST", product });
    },
    []
  );
  const openCartDrawer = useCallback(
    () => dispatch({ type: "OPEN_CART_DRAWER" }),
    []
  );
  const closeCartDrawer = useCallback(
    () => dispatch({ type: "CLOSE_CART_DRAWER" }),
    []
  );
  const isInWishlist = useCallback(
    (productId: number) => state.wishlist.some((p) => p.id === productId),
    [state.wishlist]
  );
  const setUser = useCallback(
    (user: User | null, token: string | null) => {
      if (user && token) {
        localStorage.setItem("velina_customer_token", token);
        localStorage.setItem("velina_customer_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("velina_customer_token");
        localStorage.removeItem("velina_customer_user");
      }
      dispatch({ type: "SET_USER", user, token });
    },
    []
  );
  const logout = useCallback(
    () => {
      localStorage.removeItem("velina_customer_token");
      localStorage.removeItem("velina_customer_user");
      dispatch({ type: "LOGOUT" });
    },
    []
  );

  const validateStock = useCallback(() => {
    const errors: string[] = [];
    
    state.cart.forEach(({ product, quantity }) => {
      if (product.stockQuantity !== undefined && quantity > product.stockQuantity) {
        errors.push(
          `"${product.name}" has only ${product.stockQuantity} item${product.stockQuantity !== 1 ? 's' : ''} in stock, but you're trying to order ${quantity}.`
        );
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [state.cart]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const toast: Toast = {
      id: Date.now().toString(),
      type,
      message,
      duration: 3000,
    };
    dispatch({ type: "ADD_TOAST", toast });
  }, []);

  const removeToast = useCallback((toastId: string) => {
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, []);

  const setBuyNow = useCallback((product: Product, quantity = 1) => {
    dispatch({ type: "SET_BUY_NOW", item: { product, quantity } });
  }, []);

  const clearBuyNow = useCallback(() => {
    dispatch({ type: "CLEAR_BUY_NOW" });
  }, []);

  const setWhatsAppHidden = useCallback((hidden: boolean) => {
    dispatch({ type: "SET_WHATSAPP_HIDDEN", hidden });
  }, []);

  const refreshSiteSettings = useCallback(async () => {
    try {
      const data = await fetchApi<SiteSettingsState>("/site-settings");
      if (data) {
        dispatch({ type: "SET_SITE_SETTINGS", settings: data });
      }
    } catch (e) {
      console.error("Failed to fetch site settings in store:", e);
    }
  }, []);

  // Fetch site settings on mount
  useEffect(() => {
    refreshSiteSettings();
  }, [refreshSiteSettings]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('velina_cart', JSON.stringify(state.cart));
  }, [state.cart]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('velina_wishlist', JSON.stringify(state.wishlist));
  }, [state.wishlist]);

  // Save whatsapp hidden state
  useEffect(() => {
    localStorage.setItem('velina_whatsapp_hidden', String(state.isWhatsAppHidden));
  }, [state.isWhatsAppHidden]);

  const cartTotal = state.cart.reduce(
    (sum, i) => sum + i.product.salePrice * i.quantity,
    0
  );
  const cartCount = state.cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        ...state,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        toggleWishlist,
        openCartDrawer,
        closeCartDrawer,
        isInWishlist,
        cartTotal,
        cartCount,
        setUser,
        logout,
        validateStock,
        showToast,
        removeToast,
        setBuyNow,
        clearBuyNow,
        setWhatsAppHidden,
        refreshSiteSettings,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export { StoreContext };
