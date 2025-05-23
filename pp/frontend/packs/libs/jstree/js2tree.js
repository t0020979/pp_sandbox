(function ($) {
    'use strict';

    /**
     *
     * 1. Для работы плагина поиска див дерева и инпут поиска нужно поместить в единый контейнер с классом js2tree-container
     *
     */

    // --- Константы ---

    const JS2TREE_DEFAULT_TYPES = {
        default: { icon: 'fas fa-synagogue' },
        attr_npa: { icon: 'fas fa-book' },
        attr_gir: { icon: 'ion ion-ios-keypad text-primary' },
        attr_is: { icon: 'ion ion-md-browsers text-info' },
        attr_dk: { icon: 'fas fa-cube text-info' },
        attr_group: { icon: 'fas fa-cube text-info' },
        attr_key: { icon: 'fas fa-key text-warning' },
        attr_uniq: { icon: false },
        attr_index: { icon: 'fas fa-fingerprint text-warning' },
        attr_collection: { icon: 'far fa-dot-circle text-primary' },
        attr_single: { icon: 'far fa-dot-circle text-success' },
        attr_common: { icon: false },
        attr_warning: { icon: 'fas fa-exclamation-triangle text-danger' },
        attr_data_mart: { icon: 'ion-logo-buffer text-danger' },
        attr_table: { icon: 'fas fa-table text-primary' },
        attr_attribute: { icon: 'far fa-dot-circle text-success' },
        attr_circle_success: { icon: 'far fa-check-circle text-success' },
        attr_circle_warning: { icon: 'far fa-question-circle text-warning' },
        attr_circle_danger: { icon: 'far fa-times-circle text-danger' },
        attr_attribute_unique: { icon: false }
    };

    const JS2TREE_DEFAULT_PLUGINS = ['types', 'search', 'checkbox'];


    $.fn.js2tree = function () {
        return this.each(function () {
            const $container = $(this);

            // Удаляем предыдущее дерево, если оно было
            if ($container.hasClass('jstree') || $container.data('jstree')) {
                $container.off().jstree(true).destroy();
            }

            // Инициализируем jstree с базовыми опциями
            const tree = $container.jstree({
                core: {
                    data: jstree_data($container)
                },
                plugins: getPluginsFromData($container),
                search: {
                    show_only_matches: true,
                    show_only_matches_children: true
                },
                types: JS2TREE_DEFAULT_TYPES
            });

            // Подключаем поиск
            initSearch($container);
        });
    };

    // --- Вспомогательные функции ---

    // Функция получения плагинов из data-js2tree-plugins
    function getPluginsFromData($container) {
        const pluginsRaw = $container.data('js2treePlugins');
        if (!pluginsRaw) return JS2TREE_DEFAULT_PLUGINS;

        if (typeof pluginsRaw === 'string') {
            return pluginsRaw.split(/[\s,]+/).map(p => p.trim()).filter(Boolean);
        }

        return JS2TREE_DEFAULT_PLUGINS;
    }

    // Функция включения плагина поиска js2tree_search
    function initSearch($container) {
        const $searchInput = $container.closest('.js2tree-container').find('.js2tree-search');
        if ($searchInput.length === 0) return;

        let to = false;
        $searchInput.keyup(function () {
            if (to) clearTimeout(to);
            to = setTimeout(() => {
                const value = $(this).val();
                $container.jstree(true).search(value);
            }, 250);
        });
    }

    // Функция загрузки дерева
    function jstree_data($container) {
        const url = $container.data('js2treeUrl');
        if (!url) return [];

        return {
            url: url,
            type: 'GET',
            dataType: 'json',
            contentType: 'application/json',
            data: function (node) {
                const node_id = node.id === '#' ? '0' : node.id;

                const params = {
                    parent_id: node_id
                };

                const containerOpts = $container.data('js2treeOpts');
                if (containerOpts && typeof containerOpts === 'object') {
                    $.extend(params, containerOpts);
                }

                return params;
            }
        };
    }

}(jQuery));