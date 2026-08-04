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

// Transform API product to UI product format
function transformApiToUiProduct(apiProduct: ApiProduct): Product {
  const price = Number(apiProduct.regular_price ?? apiProduct.price);
  const mrp = Number(apiProduct.mrp_price ?? price);
  const saving = Number(apiProduct.save_amount ?? Math.max(0, mrp - price));
  const percentage = Number(apiProduct.save_percentage ?? (mrp ? Math.round(saving / mrp * 100) : 0));

  return {
    id: apiProduct.id,
    name: apiProduct.title,
    brand: apiProduct.category?.name || "Velina",
    category: apiProduct.category?.name?.toLowerCase() || "skin",
    subcategory: apiProduct.sub_category?.name?.toLowerCase() || "general",
    image: apiProduct.images_url[0] || "/placeholder.png",
    originalPrice: mrp,
    salePrice: price,
    discountPercent: percentage,
    rating: 4.5,
    reviewCount: 100,
    isSale: mrp > price,
    isNew: false,
    isBestSeller: false,
    stockQuantity: apiProduct.stock_quantity,
  };
}

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

type State = {
  cart: CartItem[];
  wishlist: Product[];
  isCartDrawerOpen: boolean;
  lastAddedProduct: Product | null;
  user: User | null;
  token: string | null;
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
  | { type: "LOGOUT" };

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
};

const StoreContext = createContext<StoreContextValue | null>(null);

const initialState: State = {
  cart: [],
  wishlist: [],
  isCartDrawerOpen: false,
  lastAddedProduct: null,
  user: null,
  token: null,
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    cart: typeof window !== 'undefined' ? loadCartFromStorage() : [],
    wishlist: typeof window !== 'undefined' ? loadWishlistFromStorage() : [],
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
        // Don't allow exceeding stock
        return;
      }
      
      dispatch({ type: "ADD_TO_CART", product, openDrawer });
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
        // Don't allow exceeding stock
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







  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('velina_cart', JSON.stringify(state.cart));
  }, [state.cart]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('velina_wishlist', JSON.stringify(state.wishlist));
  }, [state.wishlist]);

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
