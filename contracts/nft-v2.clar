;; Simple NFT Contract v2
;; Mint NFTs on Stacks mainnet (basic version without trait)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-sold-out (err u102))

(define-data-var last-id uint u0)
(define-data-var max-supply uint u100)
(define-data-var mint-price uint u1000000)

(define-map nft-owners { token-id: uint } { owner: principal })

(define-read-only (get-owner (token-id uint))
  (map-get? nft-owners { token-id: token-id })
)

(define-read-only (get-last-id)
  (var-get last-id)
)

(define-read-only (get-mint-price)
  (var-get mint-price)
)

(define-public (mint)
  (let ((token-id (+ (var-get last-id) u1)))
    (asserts! (<= token-id (var-get max-supply)) err-sold-out)
    (try! (stx-transfer? (var-get mint-price) tx-sender contract-owner))
    (map-set nft-owners { token-id: token-id } { owner: tx-sender })
    (var-set last-id token-id)
    (ok token-id)
  )
)
