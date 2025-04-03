;; Fund Allocation Contract
;; Manages distribution based on verified needs

;; Define data structures
(define-data-var contract-owner principal tx-sender)
(define-data-var allocation-count uint u0)

(define-map allocations
  { allocation-id: uint }
  {
    assessment-id: uint,
    disaster-id: uint,
    amount: uint,
    recipient: principal,
    status: (string-ascii 16), ;; "pending", "approved", "disbursed", "rejected"
    timestamp: uint
  }
)

(define-map approvers
  { approver: principal }
  { authorized: bool }
)

;; Error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_INVALID_ALLOCATION u2)
(define-constant ERR_INSUFFICIENT_FUNDS u3)
(define-constant ERR_INVALID_STATUS u4)

;; Add an authorized approver
(define-public (add-approver (approver principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (map-set approvers
      { approver: approver }
      { authorized: true }
    )
    (ok true)
  )
)

;; Remove an approver's authorization
(define-public (remove-approver (approver principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (map-set approvers
      { approver: approver }
      { authorized: false }
    )
    (ok true)
  )
)

;; Propose a fund allocation
(define-public (propose-allocation
                (assessment-id uint)
                (disaster-id uint)
                (amount uint)
                (recipient principal))
  (let (
    (approver-info (default-to { authorized: false } (map-get? approvers { approver: tx-sender })))
    (current-time (unwrap-panic (get-block-info? time u0)))
    (new-id (+ (var-get allocation-count) u1))
  )
    ;; Check that sender is authorized
    (asserts! (get authorized approver-info) (err ERR_UNAUTHORIZED))
    ;; Check that amount is positive
    (asserts! (> amount u0) (err ERR_INVALID_ALLOCATION))

    ;; Store the allocation proposal
    (map-set allocations
      { allocation-id: new-id }
      {
        assessment-id: assessment-id,
        disaster-id: disaster-id,
        amount: amount,
        recipient: recipient,
        status: "pending",
        timestamp: current-time
      }
    )

    ;; Increment allocation count
    (var-set allocation-count new-id)

    (ok new-id)
  )
)

;; Approve an allocation (by contract owner)
(define-public (approve-allocation (allocation-id uint))
  (let (
    (allocation (default-to {
                  assessment-id: u0,
                  disaster-id: u0,
                  amount: u0,
                  recipient: tx-sender,
                  status: "",
                  timestamp: u0
                } (map-get? allocations { allocation-id: allocation-id })))
  )
    ;; Check that sender is contract owner
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR_UNAUTHORIZED))
    ;; Check that allocation is pending
    (asserts! (is-eq (get status allocation) "pending") (err ERR_INVALID_STATUS))

    ;; Update allocation to approved
    (map-set allocations
      { allocation-id: allocation-id }
      (merge allocation { status: "approved" })
    )

    (ok true)
  )
)

;; Disburse funds for an approved allocation
(define-public (disburse-funds (allocation-id uint))
  (let (
    (allocation (default-to {
                  assessment-id: u0,
                  disaster-id: u0,
                  amount: u0,
                  recipient: tx-sender,
                  status: "",
                  timestamp: u0
                } (map-get? allocations { allocation-id: allocation-id })))
  )
    ;; Check that sender is contract owner
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR_UNAUTHORIZED))
    ;; Check that allocation is approved
    (asserts! (is-eq (get status allocation) "approved") (err ERR_INVALID_STATUS))

    ;; Transfer STX from contract to recipient
    (try! (as-contract (stx-transfer? (get amount allocation) tx-sender (get recipient allocation))))

    ;; Update allocation to disbursed
    (map-set allocations
      { allocation-id: allocation-id }
      (merge allocation { status: "disbursed" })
    )

    (ok true)
  )
)

;; Reject an allocation
(define-public (reject-allocation (allocation-id uint))
  (let (
    (allocation (default-to {
                  assessment-id: u0,
                  disaster-id: u0,
                  amount: u0,
                  recipient: tx-sender,
                  status: "",
                  timestamp: u0
                } (map-get? allocations { allocation-id: allocation-id })))
  )
    ;; Check that sender is contract owner
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR_UNAUTHORIZED))
    ;; Check that allocation is pending or approved
    (asserts! (or (is-eq (get status allocation) "pending")
                 (is-eq (get status allocation) "approved"))
             (err ERR_INVALID_STATUS))

    ;; Update allocation to rejected
    (map-set allocations
      { allocation-id: allocation-id }
      (merge allocation { status: "rejected" })
    )

    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-allocation (allocation-id uint))
  (map-get? allocations { allocation-id: allocation-id })
)

(define-read-only (is-authorized-approver (approver principal))
  (default-to false (get authorized (map-get? approvers { approver: approver })))
)

(define-read-only (get-allocation-count)
  (var-get allocation-count)
)

(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (var-set contract-owner new-owner)
    (ok true)
  )
)

