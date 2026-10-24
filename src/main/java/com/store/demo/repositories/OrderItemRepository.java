package com.store.demo.repositories;


import com.store.demo.entities.OrderItem;
import com.store.demo.entities.pk.OrderItemPK;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, OrderItemPK> {
}