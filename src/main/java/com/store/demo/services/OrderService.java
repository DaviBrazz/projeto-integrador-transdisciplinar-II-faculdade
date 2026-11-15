package com.store.demo.services;

import com.store.demo.dtos.OrderDTO;
import com.store.demo.entities.Order;
import com.store.demo.entities.Product;
import com.store.demo.entities.User;
import com.store.demo.entities.enums.OrderStatus;
import com.store.demo.mappers.OrderMapper;
import com.store.demo.repositories.OrderItemRepository;
import com.store.demo.repositories.OrderRepository;
import com.store.demo.repositories.ProductRepository;
import com.store.demo.repositories.UserRepository;
import com.store.demo.services.exceptions.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderMapper orderMapper;

    @Transactional(readOnly = true)
    public List<Order> findAll() {
        return orderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Order findById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado com o ID: " + id));
    }

    @Transactional
    public Order insert(OrderDTO dto) {
        User client = userRepository.findById(dto.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado com o ID: " + dto.clientId()));

        // Busca todos os produtos necessários do banco para garantir os preços oficiais
        List<Long> productIds = dto.items().stream().map(OrderDTO.OrderItemDTO::productId).collect(Collectors.toList());
        List<Product> products = productRepository.findAllById(productIds);

        Order order = orderMapper.toEntity(dto, client, products);

        order = orderRepository.save(order);
        orderItemRepository.saveAll(order.getItems());

        return order;
    }

    @Transactional
    public Order updateStatus(Long id, OrderStatus newStatus) {
        Order order = findById(id);
        order.setOrderStatus(newStatus);
        return orderRepository.save(order);
    }

    @Transactional
    public void delete(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new ResourceNotFoundException("Pedido não encontrado com o ID: " + id);
        }
        orderRepository.deleteById(id);
    }
}