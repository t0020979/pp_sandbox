# frozen_string_literal: true

class Tree::CacheBuilder::ComparePodd < Tree::CacheBuilder::Base

  private

  def context_params
    @context_params ||= {
      context: context_key,
      data_mart_id: cacheable_id
    }
  end

  def build_data
    Tree::ComparePodd::StrategyResolver.call(query_params)
  end

  def build_meta
    # номер версии для сравнения.
    # дата версии
    # дата загруженных данных
    # дата провередния сравнения
    {
      schema_version: 1,
      source: self.class.name
    }
  end

  def cacheable_type
    'DataMart'
  end

end