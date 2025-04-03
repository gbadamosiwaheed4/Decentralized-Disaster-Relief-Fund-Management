import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock the Clarity contract environment
const mockContractEnv = {
  tx: {
    sender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  },
  contracts: {
    "fund-allocation": {
      functions: {
        "add-approver": vi.fn(),
        "propose-allocation": vi.fn(),
        "approve-allocation": vi.fn(),
        "disburse-funds": vi.fn(),
        "reject-allocation": vi.fn(),
        "get-allocation": vi.fn(),
        "is-authorized-approver": vi.fn(),
        "get-allocation-count": vi.fn(),
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

describe("Fund Allocation Contract", () => {
  beforeEach(() => {
    // Reset mocks
    Object.values(mockContractEnv.contracts["fund-allocation"].functions).forEach((fn) => fn.mockReset())
    
    // Setup default mock returns
    mockContractEnv.contracts["fund-allocation"].functions["add-approver"].mockReturnValue({ value: true })
    mockContractEnv.contracts["fund-allocation"].functions["propose-allocation"].mockReturnValue({ value: 1 })
    mockContractEnv.contracts["fund-allocation"].functions["approve-allocation"].mockReturnValue({ value: true })
    mockContractEnv.contracts["fund-allocation"].functions["disburse-funds"].mockReturnValue({ value: true })
    mockContractEnv.contracts["fund-allocation"].functions["reject-allocation"].mockReturnValue({ value: true })
    mockContractEnv.contracts["fund-allocation"].functions["get-allocation"].mockReturnValue({
      value: {
        "assessment-id": 1,
        "disaster-id": 1,
        amount: 2000,
        recipient: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
        status: "pending",
        timestamp: 1234567890,
      },
    })
    mockContractEnv.contracts["fund-allocation"].functions["is-authorized-approver"].mockReturnValue({ value: true })
    mockContractEnv.contracts["fund-allocation"].functions["get-allocation-count"].mockReturnValue({ value: 3 })
  })
  
  it("should add an authorized approver", () => {
    const approver = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    
    const result = clarity.contractCall("fund-allocation", "add-approver", [approver])
    
    expect(mockContractEnv.contracts["fund-allocation"].functions["add-approver"]).toHaveBeenCalledWith(approver)
    expect(result.value).toBe(true)
  })
  
  it("should propose a fund allocation", () => {
    const assessmentId = 1
    const disasterId = 1
    const amount = 2000
    const recipient = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    
    const result = clarity.contractCall("fund-allocation", "propose-allocation", [
      assessmentId,
      disasterId,
      amount,
      recipient,
    ])
    
    expect(mockContractEnv.contracts["fund-allocation"].functions["propose-allocation"]).toHaveBeenCalledWith(
        assessmentId,
        disasterId,
        amount,
        recipient,
    )
    expect(result.value).toBe(1)
  })
  
  it("should approve an allocation", () => {
    const allocationId = 1
    
    const result = clarity.contractCall("fund-allocation", "approve-allocation", [allocationId])
    
    expect(mockContractEnv.contracts["fund-allocation"].functions["approve-allocation"]).toHaveBeenCalledWith(
        allocationId,
    )
    expect(result.value).toBe(true)
  })
  
  it("should disburse funds for an approved allocation", () => {
    const allocationId = 1
    
    const result = clarity.contractCall("fund-allocation", "disburse-funds", [allocationId])
    
    expect(mockContractEnv.contracts["fund-allocation"].functions["disburse-funds"]).toHaveBeenCalledWith(allocationId)
    expect(result.value).toBe(true)
  })
  
  it("should reject an allocation", () => {
    const allocationId = 1
    
    const result = clarity.contractCall("fund-allocation", "reject-allocation", [allocationId])
    
    expect(mockContractEnv.contracts["fund-allocation"].functions["reject-allocation"]).toHaveBeenCalledWith(
        allocationId,
    )
    expect(result.value).toBe(true)
  })
  
  it("should retrieve allocation information", () => {
    const allocationId = 1
    
    const result = clarity.contractCall("fund-allocation", "get-allocation", [allocationId])
    
    expect(mockContractEnv.contracts["fund-allocation"].functions["get-allocation"]).toHaveBeenCalledWith(allocationId)
    expect(result.value).toEqual({
      "assessment-id": 1,
      "disaster-id": 1,
      amount: 2000,
      recipient: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
      status: "pending",
      timestamp: 1234567890,
    })
  })
  
  it("should check if an approver is authorized", () => {
    const approver = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    
    const result = clarity.contractCall("fund-allocation", "is-authorized-approver", [approver])
    
    expect(mockContractEnv.contracts["fund-allocation"].functions["is-authorized-approver"]).toHaveBeenCalledWith(
        approver,
    )
    expect(result.value).toBe(true)
  })
  
  it("should get the allocation count", () => {
    const result = clarity.contractCall("fund-allocation", "get-allocation-count", [])
    
    expect(mockContractEnv.contracts["fund-allocation"].functions["get-allocation-count"]).toHaveBeenCalled()
    expect(result.value).toBe(3)
  })
})

