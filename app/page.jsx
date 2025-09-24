"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { createClient } from "@supabase/supabase-js"
import { addProductAction } from "./actions"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Initialize Supabase client
let supabase = null

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http")) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export default function App() {
  const [currentView, setCurrentView] = useState("customer") // "customer" or "admin"
  const [user, setUser] = useState(null)

  const [appData, setAppData] = useState({
    categories: [
      { id: "esp", name: "Espetinhos", display_order: 1 },
      { id: "pet", name: "Petiscos", display_order: 2 },
      { id: "pra", name: "Pratos", display_order: 3 },
      { id: "sop", name: "Sopas", display_order: 4 },
      { id: "cer", name: "Cervejas 600", display_order: 5 },
      { id: "ref", name: "Refris", display_order: 6 },
      { id: "cal", name: "Caldinho", display_order: 7 },
      { id: "suc", name: "Sucos", display_order: 8 },
    ],
    products: [
      {
        id: "1",
        category_id: "esp",
        name: "Espeto de Picanha",
        description: "Acompanha farofa e vinagrete",
        price: 18.0,
        image_url: "https://placehold.co/300x300/EAD5B7/333?text=Picanha",
        is_available: true,
      },
      {
        id: "2",
        category_id: "esp",
        name: "Frango com Bacon",
        description: "Acompanha farofa",
        price: 16.0,
        image_url: "https://placehold.co/300x300/EAD5B7/333?text=Frango",
        is_available: true,
      },
      {
        id: "3",
        category_id: "esp",
        name: "Espeto Queijo Coalho",
        description: "Queijo coalho na brasa",
        price: 16.0,
        image_url: "https://placehold.co/300x300/EAD5B7/333?text=Queijo",
        is_available: true,
      },
      {
        id: "4",
        category_id: "esp",
        name: "Linguiça",
        description: "Linguiça toscana",
        price: 15.0,
        image_url: "https://placehold.co/300x300/EAD5B7/333?text=Lingui%C3%A7a",
        is_available: true,
      },
      {
        id: "5",
        category_id: "pet",
        name: "Batata Frita",
        description: "Porção de 400g com queijo",
        price: 25.0,
        image_url: "https://placehold.co/300x300/EAD5B7/333?text=Batata",
        is_available: true,
      },
      {
        id: "6",
        category_id: "ref",
        name: "Coca-Cola 1L",
        description: "Refrigerante de 1 litro",
        price: 8.0,
        image_url: "https://placehold.co/300x300/EAD5B7/333?text=Coca",
        is_available: true,
      },
      {
        id: "7",
        category_id: "ref",
        name: "Suco Natural",
        description: "Suco da fruta (consulte sabores)",
        price: null,
        image_url: "https://placehold.co/300x300/EAD5B7/333?text=Suco",
        is_available: true,
      },
      {
        id: "8",
        category_id: "pet",
        name: "Porção Especial",
        description: "Consulte opções disponíveis",
        price: null,
        image_url: "https://placehold.co/300x300/EAD5B7/333?text=Especial",
        is_available: true,
      },
    ],
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[v0] Initial session:", session?.user?.email || "No user")
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[v0] Auth state changed:", event, session?.user?.email || "No user")
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (!supabase) {
          console.log("[v0] Supabase not configured, using fallback data")
          setSupabaseConfigured(false)
          setIsLoading(false)
          return
        }

        setSupabaseConfigured(true)

        const { data: categories, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("display_order")

        if (categoriesError) throw categoriesError

        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("is_available", true)
          .order("name")

        if (productsError) throw productsError

        setAppData({
          categories: categories || [],
          products: products || [],
        })
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Erro ao carregar dados do Supabase. Usando dados de exemplo.")
        setSupabaseConfigured(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("admin") === "true") {
      setCurrentView("admin")
    }
  }, [])

  // Customer view states (existing)
  const [selectedCategory, setSelectedCategory] = useState("esp")
  const [order, setOrder] = useState([])
  const [isSummaryVisible, setIsSummaryVisible] = useState(false)

  const AdminLogin = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (e) => {
      e.preventDefault()

      if (!supabase) {
        setError("Supabase não configurado")
        return
      }

      try {
        setIsLoading(true)
        setError("")

        console.log("[v0] Attempting login with email:", email)

        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (loginError) {
          console.error("[v0] Login error:", loginError)
          setError("Email ou senha incorretos")
          return
        }

        console.log("[v0] Login successful:", data.user?.email)
        // User state will be updated automatically by onAuthStateChange
      } catch (err) {
        console.error("[v0] Login exception:", err)
        setError("Erro ao fazer login")
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <div className="min-h-screen bg-[#F8F4F0] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <Image src="/logo.png" alt="Espetinho do Nego" fill className="object-contain" />
            </div>
            <h1 className="text-xl font-bold text-[#4A131B] mb-2">Painel Administrativo - Espetinho do Nego</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B9212E] focus:border-transparent"
                placeholder="admin@espetinhodonego.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B9212E] focus:border-transparent"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#4A131B] hover:bg-[#5A1B2B] disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {!supabaseConfigured && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 text-center">
                ⚠️ Supabase não configurado. Configure as variáveis de ambiente para usar autenticação real.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const ProductForm = () => {
    const [imagePreview, setImagePreview] = useState("")

    const handleImageChange = (e) => {
      const file = e.target.files[0]
      if (file) {
        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        setImagePreview(previewUrl)
      }
    }

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Adicionar Novo Produto</h2>

        {!supabaseConfigured && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Supabase não configurado</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Os produtos serão salvos apenas localmente. Para persistir no banco de dados, configure as variáveis
                  de ambiente do Supabase.
                </p>
              </div>
            </div>
          </div>
        )}

        <form action={addProductAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto *</label>
            <input
              type="text"
              name="name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B9212E] focus:border-transparent"
              placeholder="Espetinho Misto"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
            <input
              type="number"
              name="price"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B9212E] focus:border-transparent"
              placeholder="Deixar em branco para sucos/etc."
              step="0.01"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Deixar em branco para produtos sem preço fixo</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Acompanhamentos</label>
            <textarea
              name="description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B9212E] focus:border-transparent"
              placeholder="Três de uma carne e uma de queijo coalho com farofa e vinagrete da casa"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <select
              name="categoryId"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B9212E] focus:border-transparent"
              required
            >
              <option value="">Selecione uma categoria</option>
              {appData.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do Produto</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B9212E] focus:border-transparent"
              />
              {imagePreview && (
                <div className="w-16 h-16 relative bg-gray-100 rounded-lg overflow-hidden">
                  <Image src={imagePreview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Formatos aceitos: JPG, PNG
              {supabaseConfigured && (
                <span className="block text-orange-600 mt-1">
                  ⚠️ Se o upload falhar, verifique se o bucket 'product-images' existe no Supabase Storage
                </span>
              )}
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-[#4A131B] hover:bg-[#5A1B2B] text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Salvar Produto
          </button>
        </form>
      </div>
    )
  }

  const AdminPanel = () => {
    const handleLogout = async () => {
      try {
        if (supabase) {
          console.log("[v0] Logging out user")
          await supabase.auth.signOut()
        }
        setCurrentView("customer")
        // Update URL
        window.history.pushState({}, "", window.location.pathname)
      } catch (error) {
        console.error("[v0] Logout error:", error)
      }
    }

    return (
      <div className="min-h-screen bg-[#F8F4F0]">
        {/* Admin Header */}
        <header className="bg-[#4A131B] text-white shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image src="/logo.png" alt="Espetinho do Nego" fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Painel Administrativo</h1>
                {user && <p className="text-sm text-white/80">Logado como: {user.email}</p>}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Sair
            </button>
          </div>
        </header>

        {/* Admin Content */}
        <main className="p-4 max-w-4xl mx-auto">
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <p>Carregando dados...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <ProductForm />
          )}
        </main>
      </div>
    )
  }

  // Add product to order with quantity 1 if it doesn't exist
  const handleAddToOrder = (productId) => {
    const existingItem = order.find((item) => item.productId === productId)
    if (!existingItem) {
      setOrder((prev) => [...prev, { productId, quantity: 1 }])
    }
  }

  // Increase quantity of existing product in order
  const handleIncrement = (productId) => {
    setOrder((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item)),
    )
  }

  // Decrease quantity or remove product if quantity reaches zero
  const handleDecrement = (productId) => {
    setOrder((prev) =>
      prev
        .map((item) => (item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    )
  }

  // Helper function to get order item quantity for a product
  const getOrderItemQuantity = (productId) => {
    const orderItem = order.find((item) => item.productId === productId)
    return orderItem ? orderItem.quantity : 0
  }

  const filteredProducts = appData.products.filter((product) => product.category_id === selectedCategory)

  const orderCalculations = useMemo(() => {
    const totalItems = order.reduce((sum, item) => sum + item.quantity, 0)

    // Separate priced and unpriced items
    const pricedTotal = order.reduce((sum, orderItem) => {
      const product = appData.products.find((p) => p.id === orderItem.productId)
      return sum + (product && product.price !== null ? product.price * orderItem.quantity : 0)
    }, 0)

    const unpricedItems = order
      .map((orderItem) => {
        const product = appData.products.find((p) => p.id === orderItem.productId)
        return product && product.price === null ? { product, quantity: orderItem.quantity } : null
      })
      .filter(Boolean)

    return { totalItems, pricedTotal, unpricedItems }
  }, [order, appData.products])

  const OrderSummaryModal = () => {
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [phoneError, setPhoneError] = useState(false)
    const [deliveryType, setDeliveryType] = useState("delivery")
    const [address, setAddress] = useState("")
    const [houseNumber, setHouseNumber] = useState("")
    const [neighborhood, setNeighborhood] = useState("")
    const [reference, setReference] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("dinheiro")
    const [changeAmount, setChangeAmount] = useState("")

    const validatePhone = (phone) => {
      const cleanPhone = phone.replace(/\D/g, "")
      if (cleanPhone.length !== 11) return false
      const areaCode = Number.parseInt(cleanPhone.substring(0, 2))
      return areaCode >= 11 && areaCode <= 99
    }

    const generateOrderNumber = () => {
      return Math.floor(Math.random() * 9000) + 1000
    }

    const generateDeliveryTime = () => {
      const now = new Date()
      const minTime = new Date(now.getTime() + 20 * 60000)
      const maxTime = new Date(now.getTime() + 40 * 60000)
      return `${minTime.getHours()}:${minTime.getMinutes().toString().padStart(2, "0")} às ${maxTime.getHours()}:${maxTime.getMinutes().toString().padStart(2, "0")}`
    }

    const handleSendToWhatsApp = () => {
      if (!customerName.trim() || !customerPhone.trim()) {
        alert("Por favor, preencha nome e telefone.")
        return
      }

      if (!validatePhone(customerPhone)) {
        setPhoneError(true)
        alert("Por favor, insira um número de telefone válido com 11 dígitos.")
        return
      }
      setPhoneError(false)

      if (deliveryType === "delivery" && (!address.trim() || !houseNumber.trim() || !neighborhood.trim())) {
        alert("Por favor, preencha o endereço completo para delivery.")
        return
      }

      const orderNumber = generateOrderNumber()
      const deliveryTime = generateDeliveryTime()

      let message = "✅ *PEDIDO NOVO*\n"
      message += "-----------------------------\n"
      message += "▶ *DADOS DO PEDIDO*\n\n"
      message += `Pedido: #${orderNumber}\n\n`

      // Items with price
      const pricedItems = order.filter((orderItem) => {
        const product = appData.products.find((p) => p.id === orderItem.productId)
        return product && product.price !== null
      })

      if (pricedItems.length > 0) {
        pricedItems.forEach((orderItem) => {
          const product = appData.products.find((p) => p.id === orderItem.productId)
          if (product) {
            message += `${orderItem.quantity}x ${product.name} - R$ ${(product.price * orderItem.quantity).toFixed(2).replace(".", ",")}\n`
          }
        })
      }

      // Items without price
      if (orderCalculations.unpricedItems.length > 0) {
        message += "\n*ITENS A CONSULTAR PREÇO:*\n"
        orderCalculations.unpricedItems.forEach((item) => {
          message += `${item.quantity}x ${item.product.name}\n`
        })
      }

      message += "\n- - - - - - - - - - - - -\n"
      message += `*SUBTOTAL (itens com preço):* R$ ${orderCalculations.pricedTotal.toFixed(2).replace(".", ",")}\n`
      message += "------------------------------------------\n"
      message += "▶ *DADOS DO CLIENTE*\n\n"
      message += `Nome: ${customerName}\n`

      if (deliveryType === "delivery") {
        message += `Endereço: ${address}, nº: ${houseNumber}\n`
        message += `Bairro: ${neighborhood}\n`
        if (reference.trim()) {
          message += `Complemento: ${reference}\n`
        }
      }

      message += `Telefone: ${customerPhone}\n\n`
      message += `🕙 *Estimativa de entrega:* ${deliveryTime}\n`
      message += "------------------------------\n\n"
      message += "▶ *PAGAMENTO*\n\n"

      const paymentLabels = {
        dinheiro: "Dinheiro",
        pix: "Pix",
        cartao_debito: "Cartão de Débito",
        cartao_credito: "Cartão de Crédito",
      }

      message += `Forma de Pagamento: ${paymentLabels[paymentMethod]}\n`

      if (paymentMethod === "dinheiro" && changeAmount.trim()) {
        message += `Troco para R$: ${changeAmount}\n`
      }

      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/5583998249115?text=${encodedMessage}`
      window.open(whatsappUrl, "_blank")
    }

    return (
      <div
        className={`fixed inset-0 z-[100] bg-white transform transition-transform duration-300 ${
          isSummaryVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#4A131B] text-white px-4 py-3 flex items-center justify-between shadow-lg">
          <button
            onClick={() => setIsSummaryVisible(false)}
            className="flex items-center gap-2 text-white hover:bg-white/10 px-2 py-1 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <h2 className="text-lg font-semibold">Resumo do Pedido</h2>
          <div className="w-16"></div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[85vh] pb-24">
          {/* Order Items */}
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Seus Itens</h3>
            <div className="space-y-3">
              {order.map((orderItem) => {
                const product = appData.products.find((p) => p.id === orderItem.productId)
                if (!product) return null

                return (
                  <div
                    key={orderItem.productId}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 relative bg-gray-200 rounded">
                        <Image
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm">{product.name}</h4>
                        {product.price !== null ? (
                          <p className="text-xs text-gray-500">R$ {product.price.toFixed(2).replace(".", ",")}</p>
                        ) : (
                          <p className="text-xs text-orange-600 font-medium">Preço a consultar</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecrement(orderItem.productId)}
                        className="w-7 h-7 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full flex items-center justify-center transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="text-sm font-semibold text-gray-800 min-w-[20px] text-center">
                        {orderItem.quantity}
                      </span>
                      <button
                        onClick={() => handleIncrement(orderItem.productId)}
                        className="w-7 h-7 bg-[#B9212E] hover:bg-[#9A1B26] text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 p-4 bg-[#4A131B] text-white rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold">Subtotal</span>
                <span className="text-xl font-bold">
                  R$ {orderCalculations.pricedTotal.toFixed(2).replace(".", ",")}
                </span>
              </div>

              {orderCalculations.unpricedItems.length > 0 && (
                <div className="border-t border-white/20 pt-3 mt-3">
                  <p className="text-sm text-yellow-200 mb-2">A adicionar (preço a consultar):</p>
                  {orderCalculations.unpricedItems.map((item, index) => (
                    <p key={index} className="text-sm text-white/90">
                      • {item.quantity}x {item.product.name}
                    </p>
                  ))}
                  <p className="text-xs text-yellow-200 mt-2">O valor final será calculado pela nossa atendente</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Form */}
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Seus Dados</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B9212E] focus:border-transparent"
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value)
                    if (phoneError) setPhoneError(false)
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#B9212E] focus:border-transparent ${
                    phoneError ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="(83) 99999-9999"
                />
                {phoneError && (
                  <p className="text-red-500 text-xs mt-1">
                    Número de telefone inválido. Use 11 dígitos com DDD válido.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Entrega</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeliveryType("delivery")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      deliveryType === "delivery"
                        ? "bg-[#B9212E] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Delivery
                  </button>
                  <button
                    onClick={() => setDeliveryType("pickup")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      deliveryType === "pickup"
                        ? "bg-[#B9212E] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Retirar no Local
                  </button>
                </div>
              </div>

              {deliveryType === "delivery" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço *</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B9212E] focus:border-transparent"
                      placeholder="Nome da rua"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                    <input
                      type="text"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B9212E] focus:border-transparent"
                      placeholder="Número da casa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B9212E] focus:border-transparent"
                      placeholder="Seu bairro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ponto de Referência</label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B9212E] focus:border-transparent"
                      placeholder="Próximo a..."
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod("dinheiro")}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === "dinheiro"
                        ? "bg-[#B9212E] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Dinheiro
                  </button>
                  <button
                    onClick={() => setPaymentMethod("pix")}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === "pix"
                        ? "bg-[#B9212E] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Pix
                  </button>
                  <button
                    onClick={() => setPaymentMethod("cartao_debito")}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === "cartao_debito"
                        ? "bg-[#B9212E] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Cartão de Débito
                  </button>
                  <button
                    onClick={() => setPaymentMethod("cartao_credito")}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === "cartao_credito"
                        ? "bg-[#B9212E] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Cartão de Crédito
                  </button>
                </div>

                {paymentMethod === "dinheiro" && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Troco para (opcional)</label>
                    <input
                      type="text"
                      value={changeAmount}
                      onChange={(e) => setChangeAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B9212E] focus:border-transparent"
                      placeholder="R$ 50,00"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <button
            onClick={handleSendToWhatsApp}
            className="w-full bg-[#4CAF50] hover:bg-[#45A049] text-white rounded-full px-6 py-4 shadow-lg flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
            </svg>
            <span className="font-semibold text-sm">Enviar Pedido no WhatsApp</span>
          </button>
        </div>
      </div>
    )
  }

  const CustomerView = () => {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#F8F4F0] flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <Image src="/logo.png" alt="Espetinho do Nego" fill className="object-contain" />
            </div>
            <p className="text-gray-600">Carregando cardápio...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-[#F8F4F0]">
        {!supabaseConfigured && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
            <p className="text-xs text-yellow-800 text-center">
              ⚠️ Modo demonstração - Configure o Supabase para persistir dados
            </p>
          </div>
        )}

        {/* Header Component */}
        <header className="sticky top-0 z-50 bg-[#4A131B] text-white shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image src="/logo.png" alt="Espetinho do Nego" fill className="object-contain" />
              </div>
              <h1 className="text-xl font-bold tracking-wide">cardápio</h1>
            </div>

            {/* Search Icon */}
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Category Tabs Component */}
        <div className="sticky top-[73px] z-40 bg-[#F8F4F0] border-b border-gray-200">
          <div className="flex overflow-x-auto scrollbar-hide px-4 py-2 gap-2">
            {appData.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? "bg-[#B9212E] text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid Component */}
        <main className="px-4 py-6 pb-24">
          <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
            {filteredProducts.map((product) => {
              const quantity = getOrderItemQuantity(product.id)

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <div className="aspect-square relative bg-gray-100">
                    <Image
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>

                    <div className="flex items-center justify-between">
                      {product.price !== null ? (
                        <span className="font-bold text-green-700 text-sm">
                          R$ {product.price.toFixed(2).replace(".", ",")}
                        </span>
                      ) : (
                        <span className="font-bold text-orange-600 text-xs">Consultar preço</span>
                      )}

                      {quantity === 0 ? (
                        <button
                          onClick={() => handleAddToOrder(product.id)}
                          className="w-8 h-8 bg-[#B9212E] hover:bg-[#9A1B26] text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDecrement(product.id)}
                            className="w-7 h-7 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full flex items-center justify-center transition-all duration-300"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="text-sm font-semibold text-gray-800 min-w-[20px] text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => handleIncrement(product.id)}
                            className="w-7 h-7 bg-[#B9212E] hover:bg-[#9A1B26] text-white rounded-full flex items-center justify-center transition-all duration-300"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum produto encontrado nesta categoria.</p>
            </div>
          )}
        </main>

        {/* FloatingOrderButton Component */}
        {orderCalculations.totalItems > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-50">
            <button
              onClick={() => setIsSummaryVisible(true)}
              className="w-full bg-[#4CAF50] hover:bg-[#45A049] text-white rounded-full px-6 py-4 shadow-lg flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
              </svg>

              <span className="font-semibold text-sm">
                Ver Pedido ({orderCalculations.totalItems} {orderCalculations.totalItems === 1 ? "item" : "itens"})
                {orderCalculations.pricedTotal > 0 && (
                  <> - R$ {orderCalculations.pricedTotal.toFixed(2).replace(".", ",")}</>
                )}
                {orderCalculations.unpricedItems.length > 0 && orderCalculations.pricedTotal > 0 && " +"}
                {orderCalculations.unpricedItems.length > 0 && orderCalculations.pricedTotal === 0 && " - "}
                {orderCalculations.unpricedItems.length > 0 && "itens a consultar"}
              </span>
            </button>
          </div>
        )}

        {isSummaryVisible && <OrderSummaryModal />}
      </div>
    )
  }

  if (currentView === "admin") {
    if (!user) {
      return <AdminLogin />
    }
    return <AdminPanel />
  }

  return <CustomerView />
}
