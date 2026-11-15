package com.store.demo.dtos;

import java.util.List;

public record OrderDTO(
        Long clientId,
        List<OrderItemDTO> items
) {
    public record OrderItemDTO(
            Long productId,
            Integer quantity
    ) {}
}