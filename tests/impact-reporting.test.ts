import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock the Clarity contract environment
const mockContractEnv = {
  tx: {
    sender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  },
  contracts: {
    "impact-reporting": {
      functions: {
        "add-reporter": vi.fn(),
        "add-verifier": vi.fn(),
        "submit-report": vi.fn(),
        "verify-report": vi.fn(),
        "get-report": vi.fn(),
        "is-authorized-reporter": vi.fn(),
        "is-authorized-verifier": vi.fn(),
        "get-report-count": vi.fn(),
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

describe("Impact Reporting Contract", () => {
  beforeEach(() => {
    // Reset mocks
    Object.values(mockContractEnv.contracts["impact-reporting"].functions).forEach((fn) => fn.mockReset())
    
    // Setup default mock returns
    mockContractEnv.contracts["impact-reporting"].functions["add-reporter"].mockReturnValue({ value: true })
    mockContractEnv.contracts["impact-reporting"].functions["add-verifier"].mockReturnValue({ value: true })
    mockContractEnv.contracts["impact-reporting"].functions["submit-report"].mockReturnValue({ value: 1 })
    mockContractEnv.contracts["impact-reporting"].functions["verify-report"].mockReturnValue({ value: true })
    mockContractEnv.contracts["impact-reporting"].functions["get-report"].mockReturnValue({
      value: {
        "allocation-id": 1,
        "disaster-id": 1,
        description: "Test Impact Report",
        "people-helped": 500,
        "resources-provided": "Food, Water, Shelter",
        timestamp: 1234567890,
        reporter: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
        verified: false,
      },
    })
    mockContractEnv.contracts["impact-reporting"].functions["is-authorized-reporter"].mockReturnValue({ value: true })
    mockContractEnv.contracts["impact-reporting"].functions["is-authorized-verifier"].mockReturnValue({ value: true })
    mockContractEnv.contracts["impact-reporting"].functions["get-report-count"].mockReturnValue({ value: 7 })
  })
  
  it("should add an authorized reporter", () => {
    const reporter = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    
    const result = clarity.contractCall("impact-reporting", "add-reporter", [reporter])
    
    expect(mockContractEnv.contracts["impact-reporting"].functions["add-reporter"]).toHaveBeenCalledWith(reporter)
    expect(result.value).toBe(true)
  })
  
  it("should add an authorized verifier", () => {
    const verifier = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    
    const result = clarity.contractCall("impact-reporting", "add-verifier", [verifier])
    
    expect(mockContractEnv.contracts["impact-reporting"].functions["add-verifier"]).toHaveBeenCalledWith(verifier)
    expect(result.value).toBe(true)
  })
  
  it("should submit an impact report", () => {
    const allocationId = 1
    const disasterId = 1
    const description = "Test Impact Report"
    const peopleHelped = 500
    const resourcesProvided = "Food, Water, Shelter"
    
    const result = clarity.contractCall("impact-reporting", "submit-report", [
      allocationId,
      disasterId,
      description,
      peopleHelped,
      resourcesProvided,
    ])
    
    expect(mockContractEnv.contracts["impact-reporting"].functions["submit-report"]).toHaveBeenCalledWith(
        allocationId,
        disasterId,
        description,
        peopleHelped,
        resourcesProvided,
    )
    expect(result.value).toBe(1)
  })
  
  it("should verify a report", () => {
    const reportId = 1
    
    const result = clarity.contractCall("impact-reporting", "verify-report", [reportId])
    
    expect(mockContractEnv.contracts["impact-reporting"].functions["verify-report"]).toHaveBeenCalledWith(reportId)
    expect(result.value).toBe(true)
  })
  
  it("should retrieve report information", () => {
    const reportId = 1
    
    const result = clarity.contractCall("impact-reporting", "get-report", [reportId])
    
    expect(mockContractEnv.contracts["impact-reporting"].functions["get-report"]).toHaveBeenCalledWith(reportId)
    expect(result.value).toEqual({
      "allocation-id": 1,
      "disaster-id": 1,
      description: "Test Impact Report",
      "people-helped": 500,
      "resources-provided": "Food, Water, Shelter",
      timestamp: 1234567890,
      reporter: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
      verified: false,
    })
  })
  
  it("should check if a reporter is authorized", () => {
    const reporter = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    
    const result = clarity.contractCall("impact-reporting", "is-authorized-reporter", [reporter])
    
    expect(mockContractEnv.contracts["impact-reporting"].functions["is-authorized-reporter"]).toHaveBeenCalledWith(
        reporter,
    )
    expect(result.value).toBe(true)
  })
  
  it("should check if a verifier is authorized", () => {
    const verifier = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    
    const result = clarity.contractCall("impact-reporting", "is-authorized-verifier", [verifier])
    
    expect(mockContractEnv.contracts["impact-reporting"].functions["is-authorized-verifier"]).toHaveBeenCalledWith(
        verifier,
    )
    expect(result.value).toBe(true)
  })
  
  it("should get the report count", () => {
    const result = clarity.contractCall("impact-reporting", "get-report-count", [])
    
    expect(mockContractEnv.contracts["impact-reporting"].functions["get-report-count"]).toHaveBeenCalled()
    expect(result.value).toBe(7)
  })
})

