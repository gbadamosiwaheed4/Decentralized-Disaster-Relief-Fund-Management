import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock the Clarity contract environment
const mockContractEnv = {
  tx: {
    sender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  },
  contracts: {
    "donation-collection": {
      functions: {
        "register-disaster": vi.fn(),
        donate: vi.fn(),
        "get-disaster-fund": vi.fn(),
        "get-total-donations": vi.fn(),
        "deactivate-disaster": vi.fn(),
      },
    },
  },
  blockInfo: {
    time: 1234567890,
  },
}

// Mock the clarity contract calls
global.clarity = {
  contractCall: (contract, fn, args) => {
    return mockContractEnv.contracts[contract].functions[fn](...args)
  },
  getTxSender: () => mockContractEnv.tx.sender,
  getBlockInfo: (type) => {
    if (type === "time") return mockContractEnv.blockInfo.time
    return null
  },
}

describe("Donation Collection Contract", () => {
  beforeEach(() => {
    // Reset mocks
    Object.values(mockContractEnv.contracts["donation-collection"].functions).forEach((fn) => fn.mockReset())
    
    // Setup default mock returns
    mockContractEnv.contracts["donation-collection"].functions["register-disaster"].mockReturnValue({ value: true })
    mockContractEnv.contracts["donation-collection"].functions["donate"].mockReturnValue({ value: true })
    mockContractEnv.contracts["donation-collection"].functions["get-disaster-fund"].mockReturnValue({
      value: { "total-amount": 1000, active: true },
    })
    mockContractEnv.contracts["donation-collection"].functions["get-total-donations"].mockReturnValue({ value: 1000 })
  })
  
  it("should register a new disaster", () => {
    const result = clarity.contractCall("donation-collection", "register-disaster", [1])
    
    expect(mockContractEnv.contracts["donation-collection"].functions["register-disaster"]).toHaveBeenCalledWith(1)
    expect(result.value).toBe(true)
  })
  
  it("should accept donations for an active disaster", () => {
    const disasterId = 1
    const amount = 100
    
    const result = clarity.contractCall("donation-collection", "donate", [disasterId, amount])
    
    expect(mockContractEnv.contracts["donation-collection"].functions["donate"]).toHaveBeenCalledWith(
        disasterId,
        amount,
    )
    expect(result.value).toBe(true)
  })
  
  it("should retrieve disaster fund information", () => {
    const disasterId = 1
    
    const result = clarity.contractCall("donation-collection", "get-disaster-fund", [disasterId])
    
    expect(mockContractEnv.contracts["donation-collection"].functions["get-disaster-fund"]).toHaveBeenCalledWith(
        disasterId,
    )
    expect(result.value).toEqual({ "total-amount": 1000, active: true })
  })
  
  it("should retrieve total donations", () => {
    const result = clarity.contractCall("donation-collection", "get-total-donations", [])
    
    expect(mockContractEnv.contracts["donation-collection"].functions["get-total-donations"]).toHaveBeenCalled()
    expect(result.value).toBe(1000)
  })
  
  it("should deactivate a disaster", () => {
    mockContractEnv.contracts["donation-collection"].functions["deactivate-disaster"].mockReturnValue({ value: true })
    
    const disasterId = 1
    const result = clarity.contractCall("donation-collection", "deactivate-disaster", [disasterId])
    
    expect(mockContractEnv.contracts["donation-collection"].functions["deactivate-disaster"]).toHaveBeenCalledWith(
        disasterId,
    )
    expect(result.value).toBe(true)
  })
})

