package com.store.demo.config;


import com.store.demo.entities.*;
import com.store.demo.entities.enums.OrderStatus;
import com.store.demo.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.Instant;
import java.util.Arrays;

@Configuration
@Profile("test")
public class TestConfig implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Override
    public void run(String... args) throws Exception {

        Category cat1 = new Category(null, "Eletrônicos");
        Category cat2 = new Category(null, "Livros");
        Category cat3 = new Category(null, "Informática");

        Product p1 = new Product(null, "O Senhor dos Anéis: A Sociedade do Anel", "Edição especial encadernada com mapas ilustrados e capa dura.", 89.90, "");
        Product p2 = new Product(null, "Smart TV 55\" 4K UHD", "Tela LED com comando de voz, Wi-Fi integrado e inteligência artificial.", 2499.00, "");
        Product p3 = new Product(null, "MacBook Pro 14\"", "Processador M2 Pro, 16GB de RAM, SSD de 512GB e tela Liquid Retina XDR.", 14500.00, "");
        Product p4 = new Product(null, "PC Gamer Intel Core i7", "Processador i7 de 12ª geração, 32GB RAM, SSD 1TB NVMe e Placa de Vídeo RTX 4060.", 6800.00, "");
        Product p5 = new Product(null, "Aprenda Spring Boot e Java na Prática", "Guia completo para desenvolvimento de APIs RESTful e microsserviços.", 79.90, "");


        categoryRepository.saveAll(Arrays.asList(cat1, cat2, cat3));
        productRepository.saveAll(Arrays.asList(p1, p2, p3, p4, p5));

        p1.getCategories().add(cat2);
        p2.getCategories().add(cat1);
        p2.getCategories().add(cat3);
        p3.getCategories().add(cat3);
        p4.getCategories().add(cat3);
        p5.getCategories().add(cat2);

        productRepository.saveAll(Arrays.asList(p1, p2, p3, p4, p5));

        User u1 = new User(null, "Maria Costa", "maria@gmail.com", "988888888", "123456");
        User u2 = new User(null, "Alex Santos", "alex@gmail.com", "977777777", "123456");

        Order o1 = new Order(null, Instant.parse("2019-06-20T19:53:07Z"),OrderStatus.PAID, u1);
        Order o2 = new Order(null, Instant.parse("2019-07-21T03:42:10Z"), OrderStatus.WAITING_PAYMENT,  u2);
        Order o3 = new Order(null, Instant.parse("2019-07-22T15:21:22Z"), OrderStatus.WAITING_PAYMENT,  u1);


        userRepository.saveAll(Arrays.asList(u1, u2));
        orderRepository.saveAll(Arrays.asList(o1, o2, o3));

        OrderItem oi1 = new OrderItem(o1, p1, 2, p1.getPrice());
        OrderItem oi2 = new OrderItem(o1, p3, 1, p3.getPrice());
        OrderItem oi3 = new OrderItem(o2, p3, 2, p3.getPrice());
        OrderItem oi4 = new OrderItem(o3, p5, 2, p5.getPrice());

        orderItemRepository.saveAll(Arrays.asList(oi1, oi2, oi3, oi4));

        Payment pay1 = new Payment(null, Instant.parse("2019-06-20t21:53:07Z"), o1);
        o1.setPayment(pay1);

        orderRepository.save(o1);

    }

}
