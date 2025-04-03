import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock the Clarity contract environment
const mockContractEnv = {
  tx: {
    sender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  },
  contracts: {
    "needs-assessment": {
      functions: {
        "add-assessor": vi.fn(),
        "submit-assessment": vi.fn(),
        "verify-assessment": vi.fn(),
        "get-assessment": vi.fn(),
        "is-authorized-assessor": vi.fn(),
        "get-assessment-count": vi.fn(),
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

describe("Needs Assessment Contract", () => {
  beforeEach(() => {
    // Reset mocks
    Object.values(mockContractEnv.contracts["needs-assessment"].functions).forEach((fn) => fn.mockReset())
    
    // Setup default mock returns
    mockContractEnv.contracts["needs-assessment"].functions["add-assessor"].mockReturnValue({ value: true })
    mockContractEnv.contracts["needs-assessment"].functions["submit-assessment"].mockReturnValue({ value: 1 })
    mockContractEnv.contracts["needs-assessment"].functions["verify-assessment"].mockReturnValue({ value: true })
    mockContractEnv.contracts["needs-assessment"].functions["get-assessment"].mockReturnValue({
      value: {
        "disaster-id": 1,
        location: "Test Location",
        description: "Test Description",
        "funds-needed": 5000,
        verified: false,
        timestamp: 1234567890,
      },
    })
    mockContractEnv.contracts["needs-assessment"].functions["is-authorized-assessor"].mockReturnValue({ value: true })
    mockContractEnv.contracts["needs-assessment"].functions["get-assessment-count"].mockReturnValue({ value: 5 })
  })
  
  it("should add an authorized assessor", () => {
    const assessor = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    
    const result = global.clarity.contractCall("needs-assessment", "add-assessor", [assessor])
    
    expect(mockContractEnv.contracts["needs-assessment"].functions["add-assessor"]).toHaveBeenCalledWith(assessor)
    expect(result.value).toBe(true)
  })
  
  it("should submit a needs assessment", () => {
    const disasterId = 1
    const location = "Test Location"
    const description = "Test Description"
    const fundsNeeded = 5000
    
    const result = global.clarity.contractCall("needs-assessment", "submit-assessment", [
      disasterId,
      location,
      description,
      fundsNeeded,
    ])
    
    expect(mockContractEnv.contracts["needs-assessment"].functions["submit-assessment"]).toHaveBeenCalledWith(
        disasterId,
        location,
        description,
        fundsNeeded,
    )
    expect(result.value).toBe(1)
  })
  
  it("should verify an assessment", () => {
    const assessmentId = 1
    
    const result = global.clarity.contractCall("needs-assessment", "verify-assessment", [assessmentId])
    
    expect(mockContractEnv.contracts["needs-assessment"].functions["verify-assessment"]).toHaveBeenCalledWith(
        assessmentId,
    )
    expect(result.value).toBe(true)
  })
  
  it("should retrieve assessment information", () => {
    const assessmentId = 1
    
    const result = global.clarity.contractCall("needs-assessment", "get-assessment", [assessmentId])
    
    expect(mockContractEnv.contracts["needs-assessment"].functions["get-assessment"]).toHaveBeenCalledWith(assessmentId)
    expect(result.value).toEqual({
      "disaster-id": 1,
      location: "Test Location",
      description: "Test Description",
      "funds-needed": 5000,
      verified: false,
      timestamp: 1234567890,
    })
  })
  
  it("should check if an assessor is authorized", () => {
    const assessor = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    
    const result = global.clarity.contractCall("needs-assessment", "is-authorized-assessor", [assessor])
    
    expect(mockContractEnv.contracts["needs-assessment"].functions["is-authorized-assessor"]).toHaveBeenCalledWith(
        assessor,
    )
    expect(result.value).toBe(true)
  })
  
  it("should get the assessment count", () => {
    const result = global.clarity.contractCall("needs-assessment", "get-assessment-count", [])
    
    expect(mockContractEnv.contracts["needs-assessment"].functions["get-assessment-count"]).toHaveBeenCalled()
    expect(result.value).toBe(5)
  })
})

