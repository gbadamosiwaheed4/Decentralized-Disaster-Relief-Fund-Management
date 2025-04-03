;; Impact Reporting Contract
;; Tracks how relief funds are used and their effects

;; Define data structures
(define-data-var contract-owner principal tx-sender)
(define-data-var report-count uint u0)

(define-map reports
  { report-id: uint }
  {
    allocation-id: uint,
    disaster-id: uint,
    description: (string-ascii 256),
    people-helped: uint,
    resources-provided: (string-ascii 256),
    timestamp: uint,
    reporter: principal,
    verified: bool
  }
)

(define-map reporters
  { reporter: principal }
  { authorized: bool }
)

(define-map verifiers
  { verifier: principal }
  { authorized: bool }
)

;; Error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_INVALID_REPORT u2)
(define-constant ERR_REPORT_NOT_FOUND u3)

;; Add an authorized reporter
(define-public (add-reporter (reporter principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (map-set reporters
      { reporter: reporter }
      { authorized: true }
    )
    (ok true)
  )
)

;; Add an authorized verifier
(define-public (add-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (map-set verifiers
      { verifier: verifier }
      { authorized: true }
    )
    (ok true)
  )
)

;; Remove a reporter's authorization
(define-public (remove-reporter (reporter principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (map-set reporters
      { reporter: reporter }
      { authorized: false }
    )
    (ok true)
  )
)

;; Remove a verifier's authorization
(define-public (remove-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (map-set verifiers
      { verifier: verifier }
      { authorized: false }
    )
    (ok true)
  )
)

;; Submit an impact report
(define-public (submit-report
                (allocation-id uint)
                (disaster-id uint)
                (description (string-ascii 256))
                (people-helped uint)
                (resources-provided (string-ascii 256)))
  (let (
    (reporter-info (default-to { authorized: false } (map-get? reporters { reporter: tx-sender })))
    (current-time (unwrap-panic (get-block-info? time u0)))
    (new-id (+ (var-get report-count) u1))
  )
    ;; Check that sender is authorized
    (asserts! (get authorized reporter-info) (err ERR_UNAUTHORIZED))

    ;; Store the report
    (map-set reports
      { report-id: new-id }
      {
        allocation-id: allocation-id,
        disaster-id: disaster-id,
        description: description,
        people-helped: people-helped,
        resources-provided: resources-provided,
        timestamp: current-time,
        reporter: tx-sender,
        verified: false
      }
    )

    ;; Increment report count
    (var-set report-count new-id)

    (ok new-id)
  )
)

;; Verify an impact report
(define-public (verify-report (report-id uint))
  (let (
    (verifier-info (default-to { authorized: false } (map-get? verifiers { verifier: tx-sender })))
    (report (default-to {
              allocation-id: u0,
              disaster-id: u0,
              description: "",
              people-helped: u0,
              resources-provided: "",
              timestamp: u0,
              reporter: tx-sender,
              verified: false
            } (map-get? reports { report-id: report-id })))
  )
    ;; Check that sender is authorized
    (asserts! (or (get authorized verifier-info) (is-eq tx-sender (var-get contract-owner)))
              (err ERR_UNAUTHORIZED))
    ;; Check that report exists
    (asserts! (> (get people-helped report) u0) (err ERR_REPORT_NOT_FOUND))

    ;; Update report to verified
    (map-set reports
      { report-id: report-id }
      (merge report { verified: true })
    )

    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-report (report-id uint))
  (map-get? reports { report-id: report-id })
)

(define-read-only (is-authorized-reporter (reporter principal))
  (default-to false (get authorized (map-get? reporters { reporter: reporter })))
)

(define-read-only (is-authorized-verifier (verifier principal))
  (default-to false (get authorized (map-get? verifiers { verifier: verifier })))
)

(define-read-only (get-report-count)
  (var-get report-count)
)

(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (var-set contract-owner new-owner)
    (ok true)
  )
)

