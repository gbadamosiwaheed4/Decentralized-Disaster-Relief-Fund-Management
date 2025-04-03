;; Needs Assessment Contract
;; Documents requirements in affected areas

;; Define data structures
(define-data-var contract-owner principal tx-sender)
(define-data-var assessment-count uint u0)

(define-map assessments
  { assessment-id: uint }
  {
    disaster-id: uint,
    location: (string-ascii 64),
    description: (string-ascii 256),
    funds-needed: uint,
    verified: bool,
    timestamp: uint
  }
)

(define-map assessors
  { assessor: principal }
  { authorized: bool }
)

;; Error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_INVALID_ASSESSMENT u2)
(define-constant ERR_ASSESSMENT_NOT_FOUND u3)

;; Add an authorized assessor
(define-public (add-assessor (assessor principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (map-set assessors
      { assessor: assessor }
      { authorized: true }
    )
    (ok true)
  )
)

;; Remove an assessor's authorization
(define-public (remove-assessor (assessor principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (map-set assessors
      { assessor: assessor }
      { authorized: false }
    )
    (ok true)
  )
)

;; Submit a needs assessment
(define-public (submit-assessment
                (disaster-id uint)
                (location (string-ascii 64))
                (description (string-ascii 256))
                (funds-needed uint))
  (let (
    (assessor-info (default-to { authorized: false } (map-get? assessors { assessor: tx-sender })))
    (current-time (unwrap-panic (get-block-info? time u0)))
    (new-id (+ (var-get assessment-count) u1))
  )
    ;; Check that sender is authorized
    (asserts! (get authorized assessor-info) (err ERR_UNAUTHORIZED))
    ;; Check that funds needed is positive
    (asserts! (> funds-needed u0) (err ERR_INVALID_ASSESSMENT))

    ;; Store the assessment
    (map-set assessments
      { assessment-id: new-id }
      {
        disaster-id: disaster-id,
        location: location,
        description: description,
        funds-needed: funds-needed,
        verified: false,
        timestamp: current-time
      }
    )

    ;; Increment assessment count
    (var-set assessment-count new-id)

    (ok new-id)
  )
)

;; Verify an assessment (by contract owner or authorized verifier)
(define-public (verify-assessment (assessment-id uint))
  (let (
    (assessment (default-to {
                  disaster-id: u0,
                  location: "",
                  description: "",
                  funds-needed: u0,
                  verified: false,
                  timestamp: u0
                } (map-get? assessments { assessment-id: assessment-id })))
  )
    ;; Check that sender is contract owner
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR_UNAUTHORIZED))
    ;; Check that assessment exists
    (asserts! (> (get funds-needed assessment) u0) (err ERR_ASSESSMENT_NOT_FOUND))

    ;; Update assessment to verified
    (map-set assessments
      { assessment-id: assessment-id }
      (merge assessment { verified: true })
    )

    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-assessment (assessment-id uint))
  (map-get? assessments { assessment-id: assessment-id })
)

(define-read-only (is-authorized-assessor (assessor principal))
  (default-to false (get authorized (map-get? assessors { assessor: assessor })))
)

(define-read-only (get-assessment-count)
  (var-get assessment-count)
)

(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (var-set contract-owner new-owner)
    (ok true)
  )
)

