package com.store.demo.mappers;

import com.store.demo.dtos.OrderDTO;
import com.store.demo.entities.Order;
import com.store.demo.entities.OrderItem;
import com.store.demo.entities.Product;
import com.store.demo.entities.User;
import com.store.demo.entities.enums.OrderStatus;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class OrderMapper {

    // Converte o DTO de entrada na Entidade Order para salvar no banco
    public Order toEntity(OrderDTO dto, User client, List<Product> products) {
        Order order = new Order(null, Instant.now(), OrderStatus.WAITING_PAYMENT, client);

        for (var dtoItem : dto.items()) {
            Product product = products.stream()
                    .filter(p -> p.getId().equals(dtoItem.productId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Produto não encontrado: " + dtoItem.productId()));

            OrderItem item = new OrderItem(order, product, dtoItem.quantity(), product.getPrice());
            order.getItems().add(item);
        }

        return order;
    }
}