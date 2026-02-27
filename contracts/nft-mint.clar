;; Simple NFT Minting Contract (SIP-009 compliant)
;; Mint NFTs on Stacks

(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-sold-out (err u102))
(define-constant err-mint-not-active (err u103))
(define-constant err-insufficient-funds (err u104))

;; NFT Definition
(define-non-fungible-token stacks-nft uint)

;; Data Variables
(define-data-var last-token-id uint u0)
(define-data-var max-supply uint u1000)
(define-data-var mint-price uint u1000000) ;; 1 STX
(define-data-var base-uri (string-ascii 200) "https://api.example.com/metadata/")
(define-data-var mint-active bool true)

;; SIP-009 Functions

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok (some (concat (var-get base-uri) (int-to-ascii token-id))))
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? stacks-nft token-id))
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) err-not-token-owner)
    (nft-transfer? stacks-nft token-id sender recipient)
  )
)

;; Mint Functions

(define-read-only (get-mint-price)
  (var-get mint-price)
)

(define-read-only (get-max-supply)
  (var-get max-supply)
)

(define-read-only (get-total-supply)
  (var-get last-token-id)
)

(define-read-only (is-mint-active)
  (var-get mint-active)
)

(define-public (mint)
  (let
    (
      (token-id (+ (var-get last-token-id) u1))
      (price (var-get mint-price))
    )
    ;; Check mint is active
    (asserts! (var-get mint-active) err-mint-not-active)
    ;; Check not sold out
    (asserts! (<= token-id (var-get max-supply)) err-sold-out)
    ;; Transfer payment
    (try! (stx-transfer? price tx-sender contract-owner))
    ;; Mint NFT
    (try! (nft-mint? stacks-nft token-id tx-sender))
    ;; Update token ID
    (var-set last-token-id token-id)
    (ok token-id)
  )
)

;; Admin Functions

(define-public (set-mint-price (new-price uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set mint-price new-price)
    (ok true)
  )
)

(define-public (set-base-uri (new-uri (string-ascii 200)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set base-uri new-uri)
    (ok true)
  )
)

(define-public (toggle-mint)
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set mint-active (not (var-get mint-active)))
    (ok (var-get mint-active))
  )
)

;; Helper to convert uint to string
(define-read-only (int-to-ascii (value uint))
  (if (<= value u9)
    (unwrap-panic (element-at "0123456789" value))
    (get r (fold int-to-ascii-inner
      (list u1 u2 u3 u4 u5 u6 u7 u8 u9 u10)
      { v: value, r: "" }
    ))
  )
)

(define-read-only (int-to-ascii-inner (i uint) (d { v: uint, r: (string-ascii 10) }))
  (if (> (get v d) u0)
    {
      v: (/ (get v d) u10),
      r: (unwrap-panic (as-max-len?
        (concat (unwrap-panic (element-at "0123456789" (mod (get v d) u10))) (get r d))
        u10
      ))
    }
    d
  )
)
