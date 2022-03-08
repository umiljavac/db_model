const db = {
        
        clients: {
                fields: {
                        id: 'INT(10) UNSIGNED NOT NULL AUTO_INCREMENT',
                        num: 'INT(10) UNSIGNED NOT NULL',
                        name: 'VARCHAR(255) NOT NULL',
                        description: 'text NOT NULL',
                        created_date: 'DATETIME NOT NULL DEFAULT "1970-01-01 00:00:01"',
                        modified_date: 'DATETIME NOT NULL DEFAULT "1970-01-01 00:00:01"',
                        client_type_id: 'INT(10) UNSIGNED NOT NULL',
                        client_infos_id: 'INT(10) UNSIGNED NOT NULL'
                },
                pks: {
                        id: 'PRIMARY'
                },
                fks: {
                        user_id: 'REFERENCE users (id)',
                        client_type_id: 'REFERENCE client_types (id)',
                        client_infos_id: 'REFERENCE client_infos (id)'
                }
        },
        
        client_infos: {
                fields: {
                        id: 'INT(10) UNSIGNED NOT NULL AUTO_INCREMENT',
                        infos: 'TEXT',
                },
                pks: {
                        id: 'PRIMARY'
                },
                fks: {
                }
        },
        
        client_types: {
                fields: {
                        id: 'INT(10) UNSIGNED NOT NULL AUTO_INCREMENT',
                        name: 'VARCHAR(255)',
                },
                pks: {
                        id: 'PRIMARY'
                },
                fks: {
                }
        },
}
