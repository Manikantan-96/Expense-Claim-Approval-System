package com.practice.backend.Repository;


import com.practice.backend.Entity.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReceiptRepository extends JpaRepository<Receipt, Long> {

    Optional<Receipt> findByClaimId(Long claimId);

}