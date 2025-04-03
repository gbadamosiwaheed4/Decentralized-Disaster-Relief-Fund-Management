;; Donation Collection Contract
;; Records incoming contributions for specific disasters

;; Define data variables
(define-data-var total-donations uint u0)
(define-data-var contract-owner principal tx-sender)

(define-map donations
  { donor: principal, disaster-id: uint }
  { amount: uint, timestamp: uint }
)
(define-map disaster-funds
  { disaster-id: uint }
  { total-amount: uint, active: bool }
)

;; Error codes
(define-constant ERR_INVALID_AMOUNT u1)
(define-constant ERR_DISASTER_INACTIVE u2)

;; Register a new disaster for donations
(define-public (register-disaster (disaster-id uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (map-set disaster-funds
      { disaster-id: disaster-id }
      { total-amount: u0, active: true }
    )
    (ok true)
  )
)

;; Deactivate a disaster (stop accepting donations)
(define-public (deactivate-disaster (disaster-id uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (map-set disaster-funds
      { disaster-id: disaster-id }
      (merge (default-to { total-amount: u0, active: false }
              (map-get? disaster-funds { disaster-id: disaster-id }))
             { active: false })
    )
    (ok true)
  )
)

;; Donate to a specific disaster
(define-public (donate (disaster-id uint) (amount uint))
  (let (
    (disaster-info (default-to { total-amount: u0, active: false }
                    (map-get? disaster-funds { disaster-id: disaster-id })))
    (current-time (unwrap-panic (get-block-info? time u0)))
  )
    ;; Check that amount is positive and disaster is active
    (asserts! (> amount u0) (err ERR_INVALID_AMOUNT))
    (asserts! (get active disaster-info) (err ERR_DISASTER_INACTIVE))

    ;; Transfer STX from sender to contract
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

    ;; Update donation records
    (map-set donations
      { donor: tx-sender, disaster-id: disaster-id }
      { amount: amount, timestamp: current-time }
    )

    ;; Update disaster fund total
    (map-set disaster-funds
      { disaster-id: disaster-id }
      (merge disaster-info
             { total-amount: (+ (get total-amount disaster-info) amount) })
    )

    ;; Update total donations
    (var-set total-donations (+ (var-get total-donations) amount))

    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-disaster-fund (disaster-id uint))
  (map-get? disaster-funds { disaster-id: disaster-id })
)

(define-read-only (get-donation-info (donor principal) (disaster-id uint))
  (map-get? donations { donor: donor, disaster-id: disaster-id })
)

(define-read-only (get-total-donations)
  (var-get total-donations)
)

(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (var-set contract-owner new-owner)
    (ok true)
  )
)

