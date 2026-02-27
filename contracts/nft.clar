;; SIP-009 NFT Smart Contract
;; Simple NFT minting on Stacks

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
(define-data-var mint-active bool true)
(define-data-var base-uri (string-ascii 256) "https://api.example.com/metadata/")

;; SIP-009 Functions

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok (some (var-get base-uri)))
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

;; Read-only functions

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

(define-read-only (get-balance (owner principal))
  (len (nft-get-balance? stacks-nft owner))
)

;; Public functions

;; Mint a new NFT
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
    ;; Update counter
    (var-set last-token-id token-id)
    (ok token-id)
  )
)

;; Mint multiple NFTs
(define-public (mint-many (count uint))
  (let
    (
      (current (var-get last-token-id))
      (price (* (var-get mint-price) count))
    )
    ;; Check mint is active
    (asserts! (var-get mint-active) err-mint-not-active)
    ;; Check not sold out
    (asserts! (<= (+ current count) (var-get max-supply)) err-sold-out)
    ;; Transfer payment
    (try! (stx-transfer? price tx-sender contract-owner))
    ;; Mint NFTs (up to 5 at a time)
    (if (>= count u1) (try! (nft-mint? stacks-nft (+ current u1) tx-sender)) true)
    (if (>= count u2) (try! (nft-mint? stacks-nft (+ current u2) tx-sender)) true)
    (if (>= count u3) (try! (nft-mint? stacks-nft (+ current u3) tx-sender)) true)
    (if (>= count u4) (try! (nft-mint? stacks-nft (+ current u4) tx-sender)) true)
    (if (>= count u5) (try! (nft-mint? stacks-nft (+ current u5) tx-sender)) true)
    ;; Update counter
    (var-set last-token-id (+ current count))
    (ok (+ current count))
  )
)

;; Admin functions

(define-public (set-mint-price (new-price uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ok (var-set mint-price new-price))
  )
)

(define-public (set-mint-active (active bool))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ok (var-set mint-active active))
  )
)

(define-public (set-base-uri (new-uri (string-ascii 256)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ok (var-set base-uri new-uri))
  )
)
